import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { createPacingSession, type DrillConfig } from "../src/lib/pacing";
import { pacingSummary } from "../src/lib/pacing-summary";
import {
  assertWritable,
  completeModule,
  updateResponse,
} from "../src/lib/assessment";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const questions = bank
  .filter((q) => q.section === "math" && q.skill === "linear-one")
  .slice(0, 5);
const at = new Date("2026-10-18T18:00:00Z");
const config: DrillConfig = {
  section: "math",
  skill: "linear-one",
  difficulty: "all",
  count: 5,
  seconds: 180,
};
const create = () =>
  createPacingSession({
    id: "test-session",
    owner: "owner",
    config,
    questions,
    preview: true,
    at,
  });
describe("persistent bounded pacing sessions", () => {
  it("creates one saved module with an absolute deadline and no answer keys", () => {
    const session = create();
    expect(session.mode).toBe("drill");
    expect(session.modules).toHaveLength(1);
    expect(session.modules[0].deadline).toBe("2026-10-18T18:03:00.000Z");
    expect(session.drill).toEqual(config);
    expect(JSON.stringify(session)).not.toContain("correctAnswer");
    expect(session.modules[0].answers).toEqual({});
  });
  it("uses the same server-authoritative scoring and final submission lock", () => {
    const session = create();
    updateResponse(session, 0, questions[0].id, questions[0].correctAnswer, at);
    completeModule(session, questions, new Date(at.getTime() + 40000));
    expect(session.status).toBe("complete");
    expect(session.modules[0].correct).toBe(1);
    expect(() => assertWritable(session, 0, at)).toThrow("locked");
    expect(pacingSummary(session)).toEqual({
      elapsed: 40,
      answered: 1,
      total: 5,
      correct: 1,
    });
  });
  it("rejects a write at the exact deadline and clamps elapsed time after expiry", () => {
    const session = create();
    expect(() =>
      assertWritable(session, 0, new Date(at.getTime() + 180000)),
    ).toThrow("expired");
    completeModule(session, questions, new Date(at.getTime() + 999000));
    expect(pacingSummary(session).elapsed).toBe(180);
  });
  it("requires enough distinct questions and matching section, skill and difficulty", () => {
    for (const selected of [
      questions.slice(0, 4),
      [questions[0], questions[0], ...questions.slice(2)],
    ])
      expect(() =>
        createPacingSession({
          id: "x",
          owner: "y",
          config,
          questions: selected,
          preview: true,
          at,
        }),
      ).toThrow("distinct");
    expect(() =>
      createPacingSession({
        id: "x",
        owner: "y",
        config: { ...config, section: "rw" },
        questions,
        preview: true,
        at,
      }),
    ).toThrow("match");
    expect(() =>
      createPacingSession({
        id: "x",
        owner: "y",
        config: { ...config, skill: "probability" },
        questions,
        preview: true,
        at,
      }),
    ).toThrow("match");
    expect(() =>
      createPacingSession({
        id: "x",
        owner: "y",
        config: {
          ...config,
          difficulty: questions[0].difficulty === "hard" ? "easy" : "hard",
        },
        questions,
        preview: true,
        at,
      }),
    ).toThrow("match");
  });
  it("rejects unsupported budgets and has no invented timing history before completion", () => {
    expect(() =>
      createPacingSession({
        id: "x",
        owner: "y",
        config: { ...config, seconds: 1 } as unknown as DrillConfig,
        questions,
        preview: true,
        at,
      }),
    ).toThrow("supported");
    expect(pacingSummary(create())).toEqual({
      elapsed: 0,
      answered: 0,
      total: 5,
      correct: 0,
    });
  });
});

it.each(["rw", "math"] as const)(
  "supports all bounded count/time combinations for %s without retaining answer keys",
  (section) => {
    for (const count of [5, 10, 15, 20] as const) {
      for (const seconds of [180, 300, 600, 900] as const) {
        const selected = bank
          .filter((q) => q.section === section)
          .slice(0, count);
        const exam = createPacingSession({
          id: "bounded",
          owner: "owner",
          config: { section, difficulty: "all", count, seconds },
          questions: selected,
          preview: true,
          at,
        });
        expect(exam.modules).toHaveLength(1);
        expect(exam.modules[0].questionIds).toHaveLength(count);
        expect(Date.parse(exam.modules[0].deadline!) - at.getTime()).toBe(
          seconds * 1000,
        );
        expect(JSON.stringify(exam)).not.toContain("correctAnswer");
      }
    }
  },
);
it("snapshots configuration so subsequent caller edits cannot reset the saved deadline", () => {
  const settings = { ...config };
  const exam = createPacingSession({
    id: "snapshot",
    owner: "owner",
    config: settings,
    questions,
    preview: true,
    at,
  });
  settings.seconds = 900;
  expect(exam.drill!.seconds).toBe(180);
  expect(exam.modules[0].deadline).toBe("2026-10-18T18:03:00.000Z");
});
