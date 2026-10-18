import { describe, it, expect } from "vitest";
import {
  gradeNumeric,
  gradeAnswer,
  masteryFor,
  recommend,
  selectQuestions,
  studyPlan,
  evaluation,
} from "../src/lib/engine";
import { calculate } from "../src/lib/calculator";
import {
  assertWritable,
  completeModule,
  endBreak,
  startModule,
  updateResponse,
} from "../src/lib/assessment";
import type { Attempt, Exam, Question, Skill } from "../src/lib/types";
import fs from "node:fs";
const bank = JSON.parse(fs.readFileSync("content/bank.json", "utf8"));
const taxonomy = JSON.parse(fs.readFileSync("content/taxonomy.json", "utf8"));
const questions = bank as unknown as Question[],
  skills = taxonomy as Skill[];
const at = new Date("2026-10-18T12:00:00Z");
const attempt = (overrides: Partial<Attempt> = {}): Attempt => ({
  id: "a",
  questionId: "q",
  skill: "linear-one",
  section: "math",
  domain: "Algebra",
  answer: "4",
  correct: true,
  seconds: 60,
  assisted: false,
  first: true,
  createdAt: at.toISOString(),
  difficulty: "medium",
  note: "",
  misconception: "none",
  dueAt: "2026-10-21T12:00:00Z",
  ...overrides,
});
describe("numeric answers", () => {
  it.each([
    ["2/4", "1/2", true],
    [".5", "1/2", true],
    [".333", "1/3", true],
    ["0.33", "1/3", false],
    ["1/0", "1", false],
    ["Infinity", "1", false],
    ["1+1", "2", false],
    ["-2/4", "-1/2", true],
    ["0", "0", true],
    ["1e0", "1", false],
    ["0.001", "0", false],
  ])("%s compared with %s", (x, y, result) =>
    expect(gradeNumeric(x, y)).toBe(result),
  );
  it("grades every generated key and rejects distractors", () => {
    for (const q of questions) {
      expect(gradeAnswer(q, q.correctAnswer)).toBe(true);
      for (const option of q.options.filter((x) => x !== q.correctAnswer))
        expect(gradeAnswer(q, option)).toBe(false);
    }
  });
});
describe("learning evidence", () => {
  it("keeps a conservative cold-start interval", () => {
    const m = masteryFor("linear-one", [], at);
    expect(m.n).toBe(0);
    expect(m.mean).toBe(0.5);
    expect(m.high - m.low).toBeGreaterThan(0.7);
  });
  it("updates for independent success", () =>
    expect(masteryFor("linear-one", [attempt()], at).mean).toBeGreaterThan(
      0.5,
    ));
  it("does not inflate on repeated exposure or hints", () => {
    const a = attempt();
    const original = masteryFor(a.skill, [a], at);
    expect(
      masteryFor(
        a.skill,
        [
          a,
          attempt({ id: "b", first: false }),
          attempt({ id: "c", questionId: "other", assisted: true }),
        ],
        at,
      ),
    ).toEqual(original);
  });
  it("deduplicates malformed duplicate first-exposure data", () =>
    expect(
      masteryFor("linear-one", [attempt(), attempt({ id: "b" })], at).n,
    ).toBe(1));
  it("weights difficult success and easy failure conservatively", () => {
    expect(
      masteryFor("linear-one", [attempt({ difficulty: "hard" })], at).mean,
    ).toBeGreaterThan(
      masteryFor("linear-one", [attempt({ difficulty: "easy" })], at).mean,
    );
  });
  it("decays estimated retention, not observed mastery", () => {
    const m1 = masteryFor("linear-one", [attempt()], at),
      m2 = masteryFor("linear-one", [attempt()], new Date("2026-11-18"));
    expect(m2.retention).toBeLessThan(m1.retention);
    expect(m2.mean).toBe(m1.mean);
  });
  it("uses observed counts in recommendation reasons", () => {
    const a = [
      attempt({ correct: false }),
      attempt({ questionId: "q2", correct: false }),
      attempt({ questionId: "q3" }),
    ];
    expect(
      recommend(skills, a, at).find((r) => r.skill.id === "linear-one")?.reason,
    ).toContain("2 of your last 3");
  });
  it("returns deterministic, diverse, unseen candidates", () => {
    const a = [attempt({ questionId: questions[0].id })];
    const one = selectQuestions(questions, skills, a, { count: 12 });
    expect(one).toEqual(selectQuestions(questions, skills, a, { count: 12 }));
    expect(new Set(one.map((q) => q.family)).size).toBeGreaterThan(4);
    expect(one.some((q) => q.id === questions[0].id)).toBe(false);
  });
  it("filters section and skill correctly", () =>
    expect(
      selectQuestions(questions, skills, [], {
        section: "math",
        skill: "linear-one",
        count: 8,
      }).every((q) => q.skill === "linear-one"),
    ).toBe(true));
  it("does not invent mistake questions", () =>
    expect(
      selectQuestions(questions, skills, [], { mode: "mistakes", count: 8 }),
    ).toEqual([]));
  it("builds only preferred future study days", () => {
    const p = studyPlan(
      skills,
      [],
      { testDate: "", targetScore: 1400, weeklyMinutes: 120, days: [1, 3, 5] },
      at,
    );
    expect(p).toHaveLength(3);
    expect(
      p.every(
        (d) =>
          [1, 3, 5].includes(new Date(d.date).getUTCDay()) && d.minutes === 40,
      ),
    ).toBe(true);
  });
  it("computes proper scoring rules without fabricated sample claims", () => {
    expect(evaluation([]).brier).toBeNull();
    expect(
      evaluation([
        { p: 0.5, correct: true },
        { p: 0.5, correct: false },
      ]).brier,
    ).toBe(0.25);
  });
});
describe("assessment locking and timing", () => {
  function exam(): Exam {
    return {
      id: "exam",
      userId: "user",
      mode: "simulation",
      current: 0,
      status: "active",
      breakUntil: null,
      createdAt: at.toISOString(),
      completedAt: null,
      preview: true,
      modules: [0, 1, 2, 3].map((i) => ({
        index: i,
        section: i < 2 ? "rw" : "math",
        durationSeconds: 10,
        questionIds: [questions[i].id],
        answers: {},
        flags: [],
        notes: {},
        startedAt: null,
        deadline: null,
        submittedAt: null,
        route: "initial",
      })),
    };
  }
  it("sets an absolute deadline that survives reload", () => {
    const e = exam();
    startModule(e.modules[0], at);
    expect(e.modules[0].deadline).toBe("2026-10-18T12:00:10.000Z");
    expect(() => assertWritable(e, 0, new Date(at.getTime() + 11000))).toThrow(
      "Time has expired",
    );
  });
  it("locks submitted modules and prevents cross-module writes", () => {
    const e = exam();
    startModule(e.modules[0], at);
    updateResponse(e, 0, questions[0].id, questions[0].correctAnswer, at);
    completeModule(e, questions, at);
    expect(e.modules[0].correct).toBe(1);
    expect(() => updateResponse(e, 0, questions[0].id, "changed", at)).toThrow(
      "locked",
    );
    expect(e.modules[1].route).toBe("higher-provisional");
  });
  it("enforces the section break and finishes all modules", () => {
    const e = exam();
    startModule(e.modules[0], at);
    completeModule(e, questions, at);
    completeModule(e, questions, at);
    expect(e.status).toBe("break");
    expect(() => endBreak(e, at)).toThrow("ten-minute");
    endBreak(e, new Date(at.getTime() + 600001));
    expect(e.current).toBe(2);
    completeModule(e, questions, new Date(at.getTime() + 600002));
    completeModule(e, questions, new Date(at.getTime() + 600003));
    expect(e.status).toBe("complete");
  });
});
describe("calculator", () => {
  it.each([
    ["(12+8)/5", 4],
    ["-3*2+4", -2],
    ["2*(3+4)", 14],
    [".5+1.25", 1.75],
  ])("calculates %s", (input, result) => expect(calculate(input)).toBe(result));
  it.each(["process.exit()", "1/0", "2(3)", "1..2", "(", "2+"])(
    "rejects %s",
    (s) => expect(() => calculate(s)).toThrow(),
  );
});

import { calendarDate } from "../src/lib/time";
describe("workspace calendar", () => {
  it("keeps a Chicago study day when UTC has crossed midnight", () => {
    const late = new Date("2026-10-19T01:00:00Z");
    expect(calendarDate(late)).toBe("2026-10-18");
    const plan = studyPlan(
      skills,
      [],
      { testDate: "", targetScore: 1400, weeklyMinutes: 60, days: [0] },
      late,
    );
    expect(plan[0].date).toBe("2026-10-18");
  });
});
