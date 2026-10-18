import type { Exam, ModuleState, Question, Section } from "./types";
import { gradeAnswer } from "./engine";
export const SAT_SPEC = {
  version: "sat-2026-10-18",
  breakSeconds: 600,
  modules: [
    { section: "rw" as Section, count: 27, seconds: 1920 },
    { section: "rw" as Section, count: 27, seconds: 1920 },
    { section: "math" as Section, count: 22, seconds: 2100 },
    { section: "math" as Section, count: 22, seconds: 2100 },
  ],
};
export function startModule(m: ModuleState, at = new Date()) {
  m.startedAt = at.toISOString();
  m.deadline = new Date(at.getTime() + m.durationSeconds * 1000).toISOString();
}
export function assertWritable(e: Exam, index: number, at = new Date()) {
  if (
    e.status !== "active" ||
    e.current !== index ||
    e.modules[index]?.submittedAt
  )
    throw Error("This module is locked.");
  if (
    !e.modules[index].deadline ||
    at.getTime() >= new Date(e.modules[index].deadline!).getTime()
  )
    throw Error("Time has expired. Submit this module to continue.");
}
export function updateResponse(
  e: Exam,
  index: number,
  questionId: string,
  answer: string,
  at = new Date(),
) {
  assertWritable(e, index, at);
  const m = e.modules[index];
  if (!m.questionIds.includes(questionId))
    throw Error("Question is not in this module.");
  m.answers[questionId] = answer;
}
export function completeModule(e: Exam, bank: Question[], at = new Date()) {
  if (e.status !== "active") throw Error("No active module.");
  const m = e.modules[e.current];
  if (m.submittedAt) throw Error("This module is already locked.");
  m.correct = m.questionIds.filter((id) => {
    const q = bank.find((q) => q.id === id);
    return q && gradeAnswer(q, m.answers[id] ?? "");
  }).length;
  m.submittedAt = at.toISOString();
  if (e.current === e.modules.length - 1) {
    e.status = "complete";
    e.completedAt = at.toISOString();
    return;
  }
  const next = e.modules[e.current + 1];
  if (next.section === m.section) {
    // Engineering approximation, not College Board's proprietary route.
    next.route =
      m.correct / m.questionIds.length >= 0.65
        ? "higher-provisional"
        : "lower-provisional";
  }
  e.current++;
  if (
    e.mode === "simulation" &&
    m.section === "rw" &&
    next.section === "math"
  ) {
    e.status = "break";
    e.breakUntil = new Date(
      at.getTime() + SAT_SPEC.breakSeconds * 1000,
    ).toISOString();
  } else startModule(next, at);
}
export function endBreak(e: Exam, at = new Date()) {
  if (e.status !== "break") throw Error("No break is active.");
  if (at.getTime() < new Date(e.breakUntil!).getTime())
    throw Error("The standard ten-minute break is still active.");
  e.status = "active";
  e.breakUntil = null;
  startModule(e.modules[e.current], at);
}
export function formReadiness(bank: Question[]) {
  const published = bank.filter(
    (q) =>
      q.publicationStatus === "published" && q.editorialStatus === "approved",
  );
  const rw = published.filter((q) => q.section === "rw").length,
    math = published.filter((q) => q.section === "math").length;
  return {
    rw,
    math,
    ready:
      rw >= 54 && math >= 44 && published.every((q) => q.calibration.n >= 100),
    reason:
      "Full-length forms require approved inventory, independent editorial review, and empirical item calibration. Engineering previews are not validated SAT forms.",
  };
}
