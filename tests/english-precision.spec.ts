import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const manifest = JSON.parse(
  fs.readFileSync("content/manifests/english-precision.json", "utf8"),
) as { itemIds: string[] };
const ids = new Set(manifest.itemIds);
const precision = bank.filter((q) => ids.has(q.id));
const origin = "http://127.0.0.1:3001";

test("all 88 precision candidates preserve private metadata and server-grade every key and one distractor per family", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  expect(precision).toHaveLength(88);
  expect(new Set(precision.map((q) => q.skill)).size).toBe(11);
  expect(new Set(precision.map((q) => q.family)).size).toBe(22);
  const wrongFamilies = new Set<string>();
  for (const full of precision) {
    const toggle = () =>
      page.request.post("/api/bookmark", {
        headers: { Origin: origin },
        data: { questionId: full.id },
      });
    expect((await toggle()).ok()).toBe(true);
    const payload = await (
      await page.request.get(
        `/api/questions?section=rw&skill=${full.skill}&mode=bookmarks&count=1`,
      )
    ).json();
    expect(payload.questions).toHaveLength(1);
    const q = payload.questions[0];
    expect(q.id).toBe(full.id);
    expect(q.contentHash).toBe(full.contentHash);
    expect(q.options).toEqual(full.options);
    for (const key of [
      "correctAnswer",
      "explanation",
      "steps",
      "hints",
      "solutionMethod",
      "answerEvidence",
      "distractorExplanations",
      "qualityMetadata",
    ])
      expect(q).not.toHaveProperty(key);
    const submit = (answer: string) =>
      page.request.post("/api/answer", {
        headers: { Origin: origin },
        data: {
          questionId: full.id,
          answer,
          seconds: 80,
          assisted: false,
          requestId: crypto.randomUUID(),
        },
      });
    if (!wrongFamilies.has(full.family)) {
      const wrong = full.options.find(
        (answer) => answer !== full.correctAnswer,
      )!;
      const response = await submit(wrong);
      expect(response.ok()).toBe(true);
      const grade = await response.json();
      expect(grade.correct).toBe(false);
      expect(grade.distractor).toBe(full.distractorExplanations[wrong]);
      wrongFamilies.add(full.family);
    }
    const response = await submit(full.correctAnswer);
    expect(response.ok()).toBe(true);
    const grade = await response.json();
    expect(grade.correct).toBe(true);
    expect(grade.attempt.contentHash).toBe(full.contentHash);
    expect(grade.explanation).toBe(full.explanation);
    expect(grade.steps).toEqual(full.steps);
    expect((await toggle()).ok()).toBe(true);
  }
  const state = await (await page.request.get("/api/state")).json();
  expect(state.attempts).toHaveLength(precision.length + wrongFamilies.size);
  expect(
    state.attempts.filter((a: { correct: boolean }) => a.correct),
  ).toHaveLength(88);
  expect(wrongFamilies.size).toBe(22);
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});

test("precision tables, quotations, inverted subjects, paired texts and notes stay readable on phone and desktop", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  const layouts = [
    ["rw3-table-reference", 1],
    ["rw3-table-baseline-change", 2],
    ["rw3-integrated-quotation", 0],
    ["rw3-inverted-agreement", 1],
    ["rw3-cross-definition", 0],
    ["rw3-synthesis-define", 0],
  ] as const;
  for (const [family, variant] of layouts) {
    const q = precision.find(
      (item) =>
        item.family === family && item.solutionMethod?.variantIndex === variant,
    )!;
    expect(q).toBeDefined();
    await page.request.post("/api/bookmark", {
      headers: { Origin: origin },
      data: { questionId: q.id },
    });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(
        `/practice?section=rw&skill=${q.skill}&mode=bookmarks&count=1`,
      );
      await expect(
        page.getByRole("button", { name: "Check answer", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(4);
      await expect(page.locator(".passage-text")).toContainText(
        q.passage!.slice(0, 70),
      );
      if (q.table) {
        await expect(page.getByRole("table")).toBeVisible();
        for (const header of q.table.headers)
          await expect(
            page.getByRole("columnheader", { name: header, exact: true }),
          ).toBeVisible();
      }
      if (family === "rw3-integrated-quotation")
        await expect(page.locator(".passage-text")).toContainText(
          "“a list of objects”",
        );
      if (family === "rw3-cross-definition") {
        await expect(page.locator(".passage-text")).toContainText("Text 1");
        await expect(page.locator(".passage-text")).toContainText("Text 2");
      }
      if (family === "rw3-synthesis-define")
        await expect(page.locator(".passage-text")).toContainText("•");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (width === 390)
        await page.screenshot({
          path: `evidence/english-precision/${family}-390.png`,
          fullPage: true,
        });
    }
    // Keep exactly one bookmark while testing each representative.
    await page.request.post("/api/bookmark", {
      headers: { Origin: origin },
      data: { questionId: q.id },
    });
  }
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});
