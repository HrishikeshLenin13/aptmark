import { expect, it } from "vitest";
import fs from "node:fs";
import { editorialCatalog } from "../src/lib/editorial-catalog";
import { serializePublicQuestion } from "../src/lib/public-question";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const english = bank.filter((q) => q.generatorVersion === "3.0.0");

it("counts every English method family independently of its first page", () => {
  const before = JSON.stringify(bank);
  const result = editorialCatalog(bank, { version: "3.0.0" });
  expect(result.questions).toHaveLength(50);
  expect(result.counts).toEqual({
    matching: english.length,
    pending: english.length,
    approved: 0,
    published: 0,
  });
  expect(result.families).toHaveLength(
    new Set(english.map((q) => q.family)).size,
  );
  expect(result.families.reduce((n, f) => n + f.count, 0)).toBe(english.length);
  expect(result.pagination).toEqual({
    offset: 0,
    limit: 50,
    total: english.length,
    hasPrevious: false,
    hasNext: true,
  });
  expect(JSON.stringify(bank)).toBe(before);
});

it("retains complete scoped facets when a late family is selected", () => {
  const all = editorialCatalog(bank, { version: "3.0.0" });
  const family = all.families.at(-1)!;
  const result = editorialCatalog(bank, {
    version: "3.0.0",
    skill: family.skill,
    family: family.id,
  });
  expect(result.questions).toHaveLength(4);
  expect(
    result.questions.every(
      (q) => q.family === family.id && q.skill === family.skill,
    ),
  ).toBe(true);
  expect(result.families.length).toBeGreaterThan(1);
  expect(result.counts.matching).toBe(4);
  expect(result.pagination.hasNext).toBe(false);
  expect(result.pagination.hasPrevious).toBe(false);
});

it("paginates without losing or repeating matching records", () => {
  const rows: Question[] = [];
  for (let offset = 0; offset < english.length; offset += 50) {
    const page = editorialCatalog(bank, { version: "3.0.0", offset });
    rows.push(...page.questions);
    expect(page.pagination.hasNext).toBe(offset + 50 < english.length);
  }
  expect(rows.map((q) => q.id)).toEqual(english.map((q) => q.id));
  expect(new Set(rows.map((q) => q.id)).size).toBe(english.length);
});

it("handles unmatched filters and bounded malformed offsets without widening the query", () => {
  for (const options of [
    { family: "missing" },
    { skill: "missing" },
    { version: "missing" },
    { status: "missing" },
  ])
    expect(editorialCatalog(bank, options).questions).toEqual([]);
  for (const offset of ["bad", "Infinity", -100, Number.NaN])
    expect(
      editorialCatalog(bank, { version: "3.0.0", offset }).pagination.offset,
    ).toBe(0);
  expect(editorialCatalog(bank, { offset: 1.9 }).pagination.offset).toBe(1);
  expect(editorialCatalog(bank, { offset: 1e30 }).pagination.offset).toBe(
    1_000_000,
  );
});

it("separates recorded approvals from publications without mutating any status", () => {
  const rows = english.slice(0, 3).map((q) => ({ ...q }));
  rows[0].editorialStatus = "approved";
  rows[1].editorialStatus = "approved";
  rows[1].publicationStatus = "published";
  const result = editorialCatalog(rows);
  expect(result.counts).toEqual({
    matching: 3,
    pending: 1,
    approved: 2,
    published: 1,
  });
  expect(result.questions[0].publicationStatus).toBe("candidate");
});

it("preserves method records for authorized inspection but never widens student serialization", () => {
  const item = editorialCatalog(bank, { version: "3.0.0" }).questions[0];
  expect(item).toHaveProperty("solutionMethod");
  const publicItem = serializePublicQuestion(item);
  for (const field of [
    "solutionMethod",
    "answerEvidence",
    "correctAnswer",
    "distractorExplanations",
    "qualityMetadata",
  ])
    expect(publicItem).not.toHaveProperty(field);
});
