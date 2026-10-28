import { editorialCatalog } from "@/lib/editorial-catalog";
import { studyCalendar } from "@/lib/study-calendar";
import { LESSONS, publicLesson } from "@/lib/lessons";
import { lessonProgress, recordLessonCheck } from "@/lib/lesson-store";
import policy from "@/lib/content-policy.json";
import { questionEligible } from "@/lib/content-policy";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import crypto from "node:crypto";
import {
  allQuestions,
  attempts,
  bookmarks,
  db,
  eligibleQuestions,
  hash,
  id,
  loadExam,
  now,
  preferences,
  previewEnabled,
  publicQuestion,
  question,
  rateLimit,
  saveExam,
  skills,
  transaction,
} from "@/lib/db";
import {
  currentUser,
  makeGuest,
  passwordHash,
  setSession,
  verifyPassword,
} from "@/lib/auth";
import {
  gradeAnswer,
  masteryFor,
  recommend,
  selectQuestions,
  studyPlan,
  MODEL_VERSION,
} from "@/lib/engine";
import {
  assertWritable,
  completeModule,
  endBreak,
  formReadiness,
  startModule,
  updateResponse,
} from "@/lib/assessment";
import type { Attempt, Exam, Grade, Question } from "@/lib/types";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
class APIError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const json = (v: unknown, status = 200) =>
  NextResponse.json(v, { status, headers: { "Cache-Control": "no-store" } });
const questionId = z.string().min(1).max(100);
const answerSchema = z.string().max(1500);
function available(q: Question | undefined): q is Question {
  return (
    !!q && questionEligible(q, policy, process.env.CONTENT_PREVIEW === "true")
  );
}
function getQuestion(qid: string) {
  const q = question(qid);
  if (!available(q)) throw new APIError("Question is not available.", 404);
  return q;
}
function admin(req: NextRequest) {
  const supplied = req.headers.get("x-admin-token"),
    expected = process.env.ADMIN_TOKEN;
  if (!expected || !supplied || hash(supplied) !== hash(expected))
    throw new APIError(
      "Editorial access requires the configured administrator token.",
      403,
    );
}
function activeExamQuestion(user: string, qid: string) {
  const rows = db()
    .prepare("SELECT data FROM exams WHERE user_id=?")
    .all(user) as { data: string }[];
  return rows.some((r) => {
    const e = JSON.parse(r.data) as Exam;
    return (
      e.status !== "complete" &&
      e.modules.some((m) => m.questionIds.includes(qid))
    );
  });
}
function recordAnswer(
  user: string,
  q: Question,
  answer: string,
  seconds: number,
  assisted: boolean,
  requestId: string,
  note = "",
): Grade {
  const prior = db()
    .prepare("SELECT user_id,data FROM attempts WHERE id=?")
    .get(requestId) as { user_id: string; data: string } | undefined;
  if (prior) {
    const a = JSON.parse(prior.data) as Attempt;
    if (prior.user_id !== user || a.questionId !== q.id || a.answer !== answer)
      throw new APIError(
        "This submission identifier has already been used.",
        409,
      );
    return {
      correct: a.correct,
      answer: q.correctAnswer,
      explanation: q.explanation,
      steps: q.steps,
      distractor: q.distractorExplanations[answer] ?? null,
      attempt: a,
      replayed: true,
    };
  }
  if (q.type === "mcq" && !q.options.includes(answer))
    throw new APIError("Select one of the answer choices.");
  if (
    q.type === "spr" &&
    !/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:\/[-+]?\d+)?$/.test(answer.trim())
  )
    throw new APIError("Enter a number, decimal, or fraction.");
  const old = attempts(user).filter((a) => a.questionId === q.id),
    correct = gradeAnswer(q, answer);
  const helped =
    assisted ||
    !!db()
      .prepare(
        "SELECT 1 FROM tutor_usage WHERE user_id=? AND question_id=? LIMIT 1",
      )
      .get(user, q.id);
  const createdAt = now(),
    interval = correct
      ? Math.min(30, 3 * 2 ** Math.min(old.filter((a) => a.correct).length, 3))
      : 1;
  const a: Attempt = {
    id: requestId,
    questionId: q.id,
    skill: q.skill,
    section: q.section,
    domain: q.domain,
    answer,
    correct,
    seconds,
    assisted: helped,
    first: old.length === 0,
    createdAt,
    difficulty: q.difficulty,
    note,
    misconception: correct ? "none" : "uncertain",
    dueAt: new Date(Date.now() + interval * 86400000).toISOString(),
    contentHash: q.contentHash,
    contentVersion: q.contentVersion,
  };
  db()
    .prepare("INSERT INTO attempts VALUES(?,?,?,?)")
    .run(a.id, user, q.id, JSON.stringify(a));
  db()
    .prepare("DELETE FROM drafts WHERE user_id=? AND question_id=?")
    .run(user, q.id);
  return {
    correct,
    answer: q.correctAnswer,
    explanation: q.explanation,
    steps: q.steps,
    distractor: correct ? null : (q.distractorExplanations[answer] ?? null),
    attempt: a,
  };
}
async function handler(req: NextRequest) {
  try {
    const path = req.nextUrl.pathname.replace(/^\/api\//, "");
    const write = req.method === "POST";
    if (write) {
      const origin = req.headers.get("origin");
      if (
        origin !==
        `${req.nextUrl.protocol}//${req.headers.get("host") ?? req.nextUrl.host}`
      )
        throw new APIError("Request origin did not match this workspace.", 403);
      if (Number(req.headers.get("content-length") ?? 0) > 32000)
        throw new APIError("Request is too large.", 413);
    }
    const user = await currentUser();
    let body: Record<string, unknown> = {};
    if (write) {
      try {
        const text = await req.text();
        if (text.length > 32000)
          throw new APIError("Request is too large.", 413);
        body = text ? JSON.parse(text) : {};
      } catch (e) {
        if (e instanceof APIError) throw e;
        throw new APIError("Invalid JSON request.");
      }
    }
    if (path === "health")
      return json({
        ok: true,
        model: MODEL_VERSION,
        preview: previewEnabled(),
      });
    if (path === "session" && write) {
      if (!user) {
        if (!rateLimit("guest-session", 60))
          throw new APIError(
            "Please wait a minute before creating another workspace.",
            429,
          );
        await setSession(makeGuest(), req.nextUrl.protocol === "https:");
      }
      return json({ ok: true });
    }
    if (path === "auth" && write) {
      const data = z
        .object({
          mode: z.enum(["register", "login"]),
          email: z.email().max(254),
          password: z.string().min(10).max(128),
        })
        .parse(body);
      if (!rateLimit("auth:" + hash(data.email.toLowerCase()), 8, 900000))
        throw new APIError(
          "Too many sign-in attempts. Try again in fifteen minutes.",
          429,
        );
      const email = data.email.toLowerCase();
      const existing = db()
        .prepare("SELECT id,password FROM users WHERE email=?")
        .get(email) as { id: string; password: string } | undefined;
      if (data.mode === "login") {
        if (!existing || !verifyPassword(data.password, existing.password))
          throw new APIError("Email or password did not match.", 401);
        await setSession(existing.id, req.nextUrl.protocol === "https:");
      } else {
        if (existing)
          throw new APIError(
            "This email already has an account. Sign in instead.",
            409,
          );
        const uid = user?.guest ? user.id : id(),
          encoded = passwordHash(data.password);
        if (user?.guest)
          db()
            .prepare("UPDATE users SET email=?,password=?,guest=0 WHERE id=?")
            .run(email, encoded, uid);
        else
          db()
            .prepare(
              "INSERT INTO users(id,email,password,guest,created_at) VALUES(?,?,?,0,?)",
            )
            .run(uid, email, encoded, now());
        db().prepare("DELETE FROM sessions WHERE user_id=?").run(uid);
        await setSession(uid, req.nextUrl.protocol === "https:");
      }
      return json({ ok: true });
    }
    if (!user) throw new APIError("Start a workspace or sign in first.", 401);
    if (path === "logout" && write) {
      const token = (await cookies()).get("folio_session")?.value;
      if (token)
        db().prepare("DELETE FROM sessions WHERE token=?").run(hash(token));
      (await cookies()).delete("folio_session");
      return json({ ok: true });
    }
    if (path === "delete-account" && write) {
      if (body.confirmation !== "DELETE")
        throw new APIError("Type DELETE to confirm.");
      transaction(() => {
        db().prepare("DELETE FROM reports WHERE user_id=?").run(user.id);
        db().prepare("DELETE FROM users WHERE id=?").run(user.id);
      });
      (await cookies()).delete("folio_session");
      return json({ ok: true });
    }
    if (path === "state" && !write) {
      const a = attempts(user.id),
        ss = skills(),
        bank = eligibleQuestions(),
        all = allQuestions(),
        p = preferences(user.id);
      const recs = recommend(ss, a);
      const summary = {
        generated: all.length,
        validated: all.filter((q) => q.validationResults.structural).length,
        approved: all.filter((q) => q.editorialStatus === "approved").length,
        published: all.filter((q) => q.publicationStatus === "published")
          .length,
        rejected: all.filter((q) => q.editorialStatus === "rejected").length,
        families: new Set(all.map((q) => q.family)).size,
        math: all.filter((q) => q.section === "math").length,
        rw: all.filter((q) => q.section === "rw").length,
        target: 10000,
      };
      const exams = (
        db()
          .prepare(
            "SELECT data FROM exams WHERE user_id=? ORDER BY rowid DESC LIMIT 15",
          )
          .all(user.id) as { data: string }[]
      ).map((r) => {
        const e = JSON.parse(r.data) as Exam;
        return {
          id: e.id,
          mode: e.mode,
          status: e.status,
          createdAt: e.createdAt,
          correct: e.modules.reduce((n, m) => n + (m.correct ?? 0), 0),
          total: e.modules.reduce((n, m) => n + m.questionIds.length, 0),
        };
      });
      return json({
        user,
        preview: previewEnabled(),
        inventory: summary,
        skills: ss,
        attempts: a,
        bookmarks: bookmarks(user.id),
        preferences: p,
        recommendations: recs.slice(0, 8),
        mastery: ss.map((s) => masteryFor(s.id, a)),
        plan: studyPlan(ss, a, p),
        exams,
        readiness: formReadiness(bank),
        serverTime: now(),
      });
    }
    if (path === "planner/calendar" && !write) {
      const plan = studyPlan(skills(), attempts(user.id), preferences(user.id));
      return new NextResponse(studyCalendar(plan, user.id), {
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="aptmark-study-plan.ics"',
          "Cache-Control": "private, no-store",
        },
      });
    }
    if (path === "lessons" && !write) {
      return json({
        lessons: previewEnabled() ? LESSONS.map(publicLesson) : [],
        progress: lessonProgress(user.id),
        preview: previewEnabled(),
      });
    }
    if (path === "lessons/check" && write) {
      if (!previewEnabled())
        throw new APIError("These lesson previews are not published yet.", 404);
      if (!rateLimit("lesson-check:" + user.id, 60))
        throw new APIError("Please wait a minute before checking again.", 429);
      const value = z
        .object({ lessonId: z.string().min(1).max(100), answer: answerSchema })
        .parse(body);
      const lesson = LESSONS.find((lesson) => lesson.id === value.lessonId);
      if (!lesson) throw new APIError("Lesson not found.", 404);
      if (!lesson.check.options.includes(value.answer))
        throw new APIError("Choose one of the lesson’s answer options.", 400);
      return json(recordLessonCheck(user.id, value.lessonId, value.answer));
    }
    if (path === "questions" && !write) {
      const u = req.nextUrl.searchParams;
      const opts = {
        section: u.get("section") ?? undefined,
        skill: u.get("skill") ?? undefined,
        difficulty: u.get("difficulty") ?? undefined,
        mode: u.get("mode") ?? undefined,
        count: Math.min(50, Math.max(1, Number(u.get("count")) || 10)),
        exclude: (u.get("exclude") ?? "").split(",").filter(Boolean),
        bookmarks: bookmarks(user.id),
      };
      const selected = selectQuestions(
        eligibleQuestions(),
        skills(),
        attempts(user.id),
        opts,
      );
      const drafts = Object.fromEntries(
        (
          db()
            .prepare("SELECT question_id,data FROM drafts WHERE user_id=?")
            .all(user.id) as { question_id: string; data: string }[]
        ).map((r) => [r.question_id, JSON.parse(r.data)]),
      );
      return json({ questions: selected.map(publicQuestion), drafts });
    }
    if (path === "answer" && write) {
      if (!rateLimit("answer:" + user.id, 120))
        throw new APIError(
          "Please wait a minute before submitting more answers.",
          429,
        );
      const v = z
        .object({
          questionId,
          answer: answerSchema,
          seconds: z.number().min(0).max(86400),
          assisted: z.boolean().default(false),
          requestId: z.uuid(),
          note: z.string().max(3000).default(""),
        })
        .parse(body);
      const q = getQuestion(v.questionId);
      if (activeExamQuestion(user.id, q.id))
        throw new APIError(
          "This question is reserved in an active assessment. Finish the assessment before practice review.",
          409,
        );
      return json(
        transaction(() =>
          recordAnswer(
            user.id,
            q,
            v.answer,
            v.seconds,
            v.assisted,
            v.requestId,
            v.note,
          ),
        ),
      );
    }
    if (path === "draft" && write) {
      const v = z
        .object({
          questionId,
          answer: answerSchema,
          note: z.string().max(3000).default(""),
          flag: z.boolean().default(false),
        })
        .parse(body);
      getQuestion(v.questionId);
      db()
        .prepare("INSERT OR REPLACE INTO drafts VALUES(?,?,?)")
        .run(user.id, v.questionId, JSON.stringify({ ...v, savedAt: now() }));
      return json({ savedAt: now() });
    }
    if (path === "bookmark" && write) {
      const q = getQuestion(questionId.parse(body.questionId));
      if (bookmarks(user.id).includes(q.id))
        db()
          .prepare("DELETE FROM bookmarks WHERE user_id=? AND question_id=?")
          .run(user.id, q.id);
      else db().prepare("INSERT INTO bookmarks VALUES(?,?)").run(user.id, q.id);
      return json({ bookmarks: bookmarks(user.id) });
    }
    if (path === "preferences" && write) {
      const v = z
        .object({
          testDate: z
            .string()
            .refine(
              (s) =>
                s === "" ||
                (/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))),
            ),
          targetScore: z.number().int().min(400).max(1600),
          weeklyMinutes: z.number().int().min(30).max(1800),
          days: z
            .array(z.number().int().min(0).max(6))
            .min(1)
            .max(7)
            .transform((a) => [...new Set(a)]),
        })
        .parse(body);
      db()
        .prepare("UPDATE users SET preferences=? WHERE id=?")
        .run(JSON.stringify(v), user.id);
      return json({ ok: true });
    }
    if (path === "attempt-note" && write) {
      const v = z
        .object({
          id: z.uuid(),
          note: z.string().max(3000),
          misconception: z.enum([
            "uncertain",
            "concept",
            "procedure",
            "misreading",
            "evidence",
            "grammar",
            "timing",
            "careless",
            "guess",
          ]),
        })
        .parse(body);
      const a = attempts(user.id).find((a) => a.id === v.id);
      if (!a) throw new APIError("Attempt not found.", 404);
      db()
        .prepare("UPDATE attempts SET data=? WHERE id=? AND user_id=?")
        .run(
          JSON.stringify({
            ...a,
            note: v.note,
            misconception: v.misconception,
          }),
          a.id,
          user.id,
        );
      return json({ ok: true });
    }
    if (path === "report" && write) {
      const v = z
        .object({ questionId, message: z.string().min(8).max(2000) })
        .parse(body);
      getQuestion(v.questionId);
      if (!rateLimit("report:" + user.id, 10))
        throw new APIError("Report limit reached. Try again in a minute.", 429);
      db()
        .prepare("INSERT INTO reports VALUES(?,?,?,?,?)")
        .run(id(), user.id, v.questionId, v.message, now());
      return json({ ok: true });
    }
    if (path === "tutor" && write) {
      if (!rateLimit("tutor:" + user.id, 40))
        throw new APIError("Hint limit reached. Try again in a minute.", 429);
      const v = z
          .object({ questionId, level: z.number().int().min(0).max(5) })
          .parse(body),
        q = getQuestion(v.questionId);
      if (activeExamQuestion(user.id, q.id))
        throw new APIError("Hints are paused during assessments.", 409);
      db()
        .prepare("INSERT INTO tutor_usage VALUES(?,?,?,?)")
        .run(user.id, q.id, v.level, now());
      const messages = [
        "What have you tried? Identify what the question asks before choosing a method.",
        q.hints[0],
        q.hints[1],
        q.steps[0],
        q.explanation,
        "Try an unseen question in the same skill, without a hint, to check your understanding.",
      ];
      return json({
        message: messages[v.level],
        provider: "grounded-static",
        availability:
          "Stored-explanation guide; no hosted AI model is connected.",
        level: v.level,
        answerRevealed: v.level === 4,
        ...(v.level === 4 ? { answer: q.correctAnswer } : {}),
      });
    }
    if (path === "exam/start" && write) {
      const mode = z
        .enum(["diagnostic", "math-preview", "full"])
        .parse(body.mode);
      const bank = eligibleQuestions();
      if (mode === "full")
        throw new APIError(
          "Full-length release is gated: approved, calibrated test forms and independent editorial review are still required.",
          409,
        );
      const existing = (
        db().prepare("SELECT data FROM exams WHERE user_id=?").all(user.id) as {
          data: string;
        }[]
      )
        .map((r) => JSON.parse(r.data) as Exam)
        .find((e) => e.status !== "complete");
      if (existing) return json({ id: existing.id });
      const qs =
        mode === "math-preview"
          ? selectQuestions(bank, skills(), attempts(user.id), {
              section: "math",
              count: 22,
            })
          : ["rw", "math"].flatMap((section) =>
              selectQuestions(bank, skills(), attempts(user.id), {
                section,
                count: 6,
              }),
            );
      if (qs.length < (mode === "math-preview" ? 22 : 12))
        throw new APIError(
          "There are not enough eligible questions to assemble this preview.",
          409,
        );
      const groups =
        mode === "math-preview" ? [qs] : [qs.slice(0, 6), qs.slice(6)];
      const exam: Exam = {
        id: id(),
        userId: user.id,
        mode: mode === "diagnostic" ? "diagnostic" : "simulation",
        modules: groups.map((qq, index) => ({
          index,
          section: qq[0].section,
          durationSeconds: mode === "math-preview" ? 2100 : 480,
          questionIds: qq.map((q) => q.id),
          answers: {},
          flags: [],
          notes: {},
          startedAt: null,
          deadline: null,
          submittedAt: null,
          route: "preview-uncalibrated",
        })),
        current: 0,
        status: "active",
        breakUntil: null,
        createdAt: now(),
        completedAt: null,
        preview: previewEnabled(),
      };
      startModule(exam.modules[0]);
      saveExam(exam);
      return json({ id: exam.id });
    }
    if (path === "exam" && !write) {
      const e = loadExam(req.nextUrl.searchParams.get("id") ?? "", user.id);
      if (!e) throw new APIError("Assessment not found.", 404);
      // Timed modules expire on the server even if the browser was closed.
      if (
        e.status === "active" &&
        e.modules[e.current].deadline &&
        Date.now() >= Date.parse(e.modules[e.current].deadline!)
      ) {
        transaction(() => {
          completeModule(e, allQuestions());
          persistExamAttempts(user.id, e);
          saveExam(e);
        });
      }
      const module = e.modules[e.current];
      return json({
        exam: e,
        questions: module.questionIds.map((id) =>
          publicQuestion(getQuestion(id)),
        ),
        serverTime: now(),
        ...(e.status === "complete"
          ? {
              review: e.modules.flatMap((m) =>
                m.questionIds.map((qid) => {
                  const q = getQuestion(qid);
                  return {
                    question: publicQuestion(q),
                    answer: m.answers[qid] ?? "",
                    correct: gradeAnswer(q, m.answers[qid] ?? ""),
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                  };
                }),
              ),
            }
          : {}),
      });
    }
    if (path === "exam/save" && write) {
      const v = z
        .object({
          id: z.uuid(),
          index: z.number().int().min(0).max(3),
          questionId,
          answer: answerSchema,
          flag: z.boolean(),
          note: z.string().max(3000),
        })
        .parse(body);
      const e = loadExam(v.id, user.id);
      if (!e) throw new APIError("Assessment not found.", 404);
      assertWritable(e, v.index);
      const q = getQuestion(v.questionId);
      if (v.answer && q.type === "mcq" && !q.options.includes(v.answer))
        throw new APIError("Invalid answer choice.");
      assertWritable(e, v.index);
      updateResponse(e, v.index, v.questionId, v.answer);
      const m = e.modules[v.index];
      m.flags = v.flag
        ? [...new Set([...m.flags, v.questionId])]
        : m.flags.filter((x) => x !== v.questionId);
      m.notes[v.questionId] = v.note;
      saveExam(e);
      return json({ savedAt: now() });
    }
    if (path === "exam/submit" && write) {
      const v = z.object({ id: z.uuid(), index: z.number().int() }).parse(body);
      const e = loadExam(v.id, user.id);
      if (!e) throw new APIError("Assessment not found.", 404);
      if (e.current !== v.index || e.status !== "active")
        throw new APIError("This module is no longer active.", 409);
      transaction(() => {
        completeModule(e, allQuestions());
        persistExamAttempts(user.id, e);
        saveExam(e);
      });
      return json({ ok: true });
    }
    if (path === "exam/resume" && write) {
      const e = loadExam(z.uuid().parse(body.id), user.id);
      if (!e) throw new APIError("Assessment not found.", 404);
      endBreak(e);
      saveExam(e);
      return json({ ok: true });
    }
    if (path === "admin" && !write) {
      admin(req);
      const u = req.nextUrl.searchParams;
      const all = allQuestions();
      return json({
        ...editorialCatalog(all, {
          skill: u.get("skill"),
          version: u.get("version"),
          status: u.get("status"),
          family: u.get("family"),
          offset: u.get("offset"),
        }),
        reports: db()
          .prepare(
            "SELECT id,question_id,message,created_at FROM reports ORDER BY rowid DESC LIMIT 100",
          )
          .all(),
        audit: db()
          .prepare("SELECT * FROM editorial ORDER BY rowid DESC LIMIT 30")
          .all(),
      });
    }
    if (path === "admin/review" && write) {
      admin(req);
      const v = z
        .object({
          questionId,
          action: z.enum(["approve", "reject", "publish", "unpublish"]),
          reviewer: z.string().min(3).max(120),
          notes: z.string().min(15).max(3000),
        })
        .parse(body);
      const q = question(v.questionId);
      if (!q) throw new APIError("Question not found.", 404);
      if (
        v.action === "publish" &&
        (!q.validationResults.structural || q.editorialStatus !== "approved")
      )
        throw new APIError(
          "Pass validation and approve the question before publication.",
        );
      transaction(() => {
        q.editorialStatus =
          v.action === "reject"
            ? "rejected"
            : ["approve", "publish"].includes(v.action)
              ? "approved"
              : q.editorialStatus;
        q.publicationStatus =
          v.action === "publish" ? "published" : "candidate";
        q.reviewer = v.reviewer;
        q.reviewNotes = v.notes;
        db()
          .prepare("UPDATE questions SET data=? WHERE id=?")
          .run(JSON.stringify(q), q.id);
        db()
          .prepare("INSERT INTO editorial VALUES(?,?,?,?,?,?)")
          .run(id(), q.id, v.reviewer, v.action, v.notes, now());
      });
      return json({ ok: true });
    }
    throw new APIError("Route not found.", 404);
  } catch (e) {
    if (e instanceof APIError) return json({ error: e.message }, e.status);
    if (e instanceof z.ZodError)
      return json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if (
      e instanceof Error &&
      /module|break|Time has|Question is not/.test(e.message)
    )
      return json({ error: e.message }, 409);
    console.error("API failure", e);
    return json(
      {
        error:
          "The server could not complete this request. Your saved work has been retained.",
      },
      500,
    );
  }
}
function persistExamAttempts(user: string, e: Exam) {
  for (const m of e.modules.filter((m) => m.submittedAt)) {
    for (const qid of m.questionIds) {
      const q = question(qid)!;
      const requestId = crypto
        .createHash("sha256")
        .update(e.id + qid)
        .digest("hex");
      if (db().prepare("SELECT 1 FROM attempts WHERE id=?").get(requestId))
        continue;
      const answer = m.answers[qid] ?? "";
      if (!answer) continue;
      recordAnswer(
        user,
        q,
        answer,
        Math.min(
          m.durationSeconds,
          (Date.parse(m.submittedAt!) - Date.parse(m.startedAt!)) / 1000,
        ) / m.questionIds.length,
        false,
        requestId,
      );
    }
  }
}
export { handler as GET, handler as POST };
