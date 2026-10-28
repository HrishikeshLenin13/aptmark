import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const added = bank.filter((q) => q.generatorVersion === "3.0.0");
const representatives = [...new Set(added.map((q) => q.skill))].map((skill) =>
  added.find((q) => q.skill === skill)!,
);
const origin = "http://127.0.0.1:3001";

test("all eleven English skills load original candidates, hide keys and methods, and grade on the server", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  expect(representatives).toHaveLength(11);
  for (const full of representatives) {
    const bookmark = await page.request.post("/api/bookmark", {
      headers: { Origin: origin },
      data: { questionId: full.id },
    });
    expect(bookmark.ok()).toBe(true);
    const res = await page.request.get(
      `/api/questions?section=rw&skill=${full.skill}&mode=bookmarks&count=5`,
    );
    expect(res.ok()).toBe(true);
    const { questions } = await res.json();
    expect(questions).toHaveLength(1);
    const q = questions[0];
    expect(q.id).toBe(full.id);
    expect(q.options).toEqual(full.options);
    expect(q.options).toHaveLength(4);
    for (const key of [
      "correctAnswer",
      "explanation",
      "steps",
      "hints",
      "solutionMethod",
      "answerEvidence",
      "qualityMetadata",
      "distractorExplanations",
    ])
      expect(q).not.toHaveProperty(key);
    const response = await page.request.post("/api/answer", {
      headers: { Origin: origin },
      data: {
        questionId: full.id,
        answer: full.correctAnswer,
        seconds: 65,
        assisted: false,
        requestId: crypto.randomUUID(),
      },
    });
    expect(response.ok()).toBe(true);
    const grade = await response.json();
    expect(grade.correct).toBe(true);
    expect(grade.explanation).toBe(full.explanation);
    expect(grade.steps).toEqual(full.steps);
  }
  const state = await (await page.request.get("/api/state")).json();
  expect(
    state.attempts.filter((a: { questionId: string }) =>
      representatives.some((q) => q.id === a.questionId),
    ),
  ).toHaveLength(11);
  const admin = await page.request.get("/api/admin?version=3.0.0", {
    headers: { "x-admin-token": "folio-e2e-only" },
  });
  const editorial = await admin.json();
  expect(editorial.questions).toHaveLength(50);
  expect(
    editorial.questions.every(
      (q: Question) =>
        q.editorialStatus === "pending" && q.publicationStatus === "candidate",
    ),
  ).toBe(true);
  expect(editorial.questions[0]).toHaveProperty("solutionMethod");
  expect((await page.request.get("/api/admin?version=3.0.0")).status()).toBe(
    403,
  );
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});

test("new paired texts, research notes and quantitative tables render with four choices on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  for (const skill of [
    "cross-text",
    "synthesis",
    "quantitative-evidence",
    "boundaries",
    "form-structure",
  ]) {
    const q = representatives.find((item) => item.skill === skill)!;
    await page.request.post("/api/bookmark", {
      headers: { Origin: origin },
      data: { questionId: q.id },
    });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(
        `/practice?section=rw&skill=${skill}&mode=bookmarks&count=1`,
      );
      await expect(
        page.getByRole("button", { name: "Check answer", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(4);
      await expect(page.locator(".passage-text")).toContainText(
        q.passage!.slice(0, 65),
      );
      if (skill === "cross-text") {
        await expect(page.locator(".passage-text")).toContainText("Text 1");
        await expect(page.locator(".passage-text")).toContainText("Text 2");
      }
      if (q.table) await expect(page.getByRole("table")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const axe = await new AxeBuilder({ page }).analyze();
      expect(axe.violations).toEqual([]);
      if (
        width === 390 &&
        ["cross-text", "synthesis", "quantitative-evidence"].includes(skill)
      )
        await page.screenshot({
          path: `evidence/english-methods/${skill}-390.png`,
          fullPage: true,
        });
    }
  }
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});
