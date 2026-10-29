import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const manifest = JSON.parse(
  fs.readFileSync("content/manifests/english-literary.json", "utf8"),
) as { itemIds: string[] };
const ids = new Set(manifest.itemIds);
const literary = bank.filter((q) => ids.has(q.id));
const origin = "http://127.0.0.1:3001";

test("all 24 literary candidates preserve private metadata and server-grade every key and all 72 distractors", async ({
  page,
}) => {
  test.setTimeout(180000);
  expect(literary).toHaveLength(24);
  expect(new Set(literary.map((q) => q.skill)).size).toBe(6);
  const families = new Set<string>();
  let keysChecked = 0,
    distractorsChecked = 0;
  // Isolated guest histories keep exhaustive checks below the real
  // per-account 120-answer/minute limit. Production rate limits stay intact.
  for (let offset = 0; offset < literary.length; offset += 11) {
    const batch = literary.slice(offset, offset + 11);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "A fresh page. A stronger start." }),
    ).toBeVisible();
    expect(
      (await (await page.request.get("/api/state")).json()).attempts,
    ).toHaveLength(0);
    try {
      for (const full of batch) {
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
        for (const wrong of full.options.filter(
          (a) => a !== full.correctAnswer,
        )) {
          const response = await submit(wrong);
          expect(
            response.ok(),
            `wrong-choice grade status ${response.status()} for ${full.id}`,
          ).toBe(true);
          const grade = await response.json();
          expect(grade.correct).toBe(false);
          expect(grade.distractor).toBe(full.distractorExplanations[wrong]);
          distractorsChecked++;
        }
        const response = await submit(full.correctAnswer);
        expect(
          response.ok(),
          `key grade status ${response.status()} for ${full.id}`,
        ).toBe(true);
        const grade = await response.json();
        expect(grade.correct).toBe(true);
        expect(grade.attempt.contentHash).toBe(full.contentHash);
        expect(grade.explanation).toBe(full.explanation);
        expect(grade.steps).toEqual(full.steps);
        keysChecked++;
        families.add(full.family);
        expect((await toggle()).ok()).toBe(true);
      }
      const state = await (await page.request.get("/api/state")).json();
      expect(state.attempts).toHaveLength(batch.length * 4);
      expect(
        state.attempts.filter((a: { correct: boolean }) => a.correct),
      ).toHaveLength(batch.length);
    } finally {
      const deleted = await page.request.post("/api/delete-account", {
        headers: { Origin: origin },
        data: { confirmation: "DELETE" },
      });
      expect(deleted.ok()).toBe(true);
    }
  }
  expect(keysChecked).toBe(24);
  expect(distractorsChecked).toBe(72);
  expect(families.size).toBe(6);
});

test("original poetry, quoted choices, narratives and paired criticism stay readable on phone and desktop", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  const layouts = [
    ["rw3-literary-held-tension", 0],
    ["rw3-literary-action-evidence", 0],
    ["rw3-literary-perspective-limit", 1],
    ["rw3-literary-context-shade", 2],
    ["rw3-literary-final-image", 2],
    ["rw3-literary-cross-reading", 2],
  ] as const;
  for (const [family, variant] of layouts) {
    const q = literary.find(
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
      if (family === "rw3-literary-cross-reading") {
        await expect(page.locator(".passage-text")).toContainText("Text 1");
        await expect(page.locator(".passage-text")).toContainText("Text 2");
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `evidence/english-literary/${family}-${variant}-${width}.png`,
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
