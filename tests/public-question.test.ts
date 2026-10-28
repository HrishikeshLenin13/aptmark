import { expect, it } from "vitest";
import fs from "node:fs";
import { serializePublicQuestion } from "../src/lib/public-question";
import type { Question } from "../src/lib/types";

it("never serializes editorial answer evidence or future unknown fields before grading", () => {
  const bank = JSON.parse(
    fs.readFileSync("content/bank.json", "utf8"),
  ) as Question[];
  const q = {
    ...bank[0],
    answerEvidence: {
      quotes: ["the keyed evidence"],
      reasoning: "the correct answer",
    },
    qualityMetadata: {
      difficultyBasis: ["answer-revealing detail"],
      reviewFlags: [],
    },
    reviewer: "Private editor",
    reviewNotes: "The correct answer is stored here too.",
    futureAnswerField: "private by default",
  };
  const output = serializePublicQuestion(q);
  for (const key of [
    "correctAnswer",
    "acceptedResponses",
    "explanation",
    "steps",
    "hints",
    "distractorExplanations",
    "validationResults",
    "answerEvidence",
    "qualityMetadata",
    "reviewer",
    "reviewNotes",
    "futureAnswerField",
  ])
    expect(output).not.toHaveProperty(key);
  expect(output.id).toBe(q.id);
  expect(output.options).toEqual(q.options);
});

it("keeps every new English method and answer rationale private before grading", () => {
  const bank = JSON.parse(
    fs.readFileSync("content/bank.json", "utf8"),
  ) as Question[];
  const added = bank.filter((q) => q.generatorVersion === "3.0.0");
  expect(added.length).toBeGreaterThanOrEqual(156);
  for (const q of added) {
    const output = serializePublicQuestion(q);
    for (const key of [
      "solutionMethod",
      "answerEvidence",
      "distractorExplanations",
      "steps",
      "hints",
      "explanation",
      "correctAnswer",
      "qualityMetadata",
      "alignment",
    ])
      expect(output).not.toHaveProperty(key);
    expect(output.options).toHaveLength(4);
    expect(output.section).toBe("rw");
  }
});
