import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { LESSONS, checkLesson, publicLesson } from "../src/lib/lessons";

describe("original foundation lesson contract", () => {
  it("has unique ids and a valid four-option check in every lesson", () => {
    expect(LESSONS).toHaveLength(12);
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    const skills = JSON.parse(
      fs.readFileSync("content/taxonomy.json", "utf8"),
    ) as { id: string }[];
    for (const lesson of LESSONS) {
      expect(skills.some((s) => s.id === lesson.skill)).toBe(true);
      expect(lesson.version).toBeGreaterThan(0);
      expect(lesson.steps.length).toBeGreaterThan(1);
      expect(lesson.example.reasoning.length).toBeGreaterThan(1);
      expect(lesson.check.options).toHaveLength(4);
      expect(new Set(lesson.check.options).size).toBe(4);
      expect(lesson.check.options).toContain(lesson.check.answer);
    }
  });
  it("grades correct and incorrect responses using server-only keys", () => {
    for (const lesson of LESSONS) {
      expect(checkLesson(lesson.id, lesson.check.answer)).toMatchObject({
        correct: true,
        version: lesson.version,
      });
      const wrong = lesson.check.options.find(
        (option) => option !== lesson.check.answer,
      )!;
      expect(checkLesson(lesson.id, wrong)).toMatchObject({
        correct: false,
        answer: lesson.check.answer,
      });
    }
  });
  it("rejects unknown lessons and invalid options", () => {
    expect(checkLesson("not-a-lesson", "x")).toBeNull();
    expect(() => checkLesson(LESSONS[0].id, "not an option")).toThrow(
      "answer options",
    );
  });
  it("allowlists the public body without hidden check keys or future editorial fields", () => {
    for (const lesson of LESSONS) {
      const output = publicLesson({
        ...lesson,
        privateReview: "do not expose",
      } as typeof lesson);
      expect(Object.keys(output.check).sort()).toEqual(["options", "prompt"]);
      expect(output).not.toHaveProperty("privateReview");
      expect(output.check).not.toHaveProperty("answer");
      expect(output.check).not.toHaveProperty("explanation");
    }
  });
});
