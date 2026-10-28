import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Exam, Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const origin = "http://127.0.0.1:3001";
async function post(page: Page, endpoint: string, data: unknown) {
  return page.request.post("/api/" + endpoint, {
    headers: { Origin: origin },
    data,
  });
}
async function ready(page: Page) {
  await page.goto("/drills");
  await expect(
    page.getByRole("heading", { name: "Find a pace you can trust." }),
  ).toBeVisible();
}
async function begin(page: Page) {
  await ready(page);
  await page
    .getByRole("combobox", { name: "Pacing skill", exact: true })
    .selectOption("words-context");
  await page
    .getByRole("button", { name: "Begin timed set", exact: true })
    .click();
  await expect(
    page.getByText("Pacing practice", { exact: true }),
  ).toBeVisible();
  const id = new URL(page.url()).searchParams.get("id")!;
  return (await (await page.request.get("/api/exam?id=" + id)).json()) as {
    exam: Exam;
    questions: Question[];
  };
}
async function answerFirst(page: Page, data: { questions: Question[] }) {
  const q = data.questions[0],
    answer = bank.find((item) => item.id === q.id)!.correctAnswer;
  if (q.type === "mcq")
    await page.getByRole("radio").nth(q.options.indexOf(answer)).check();
  else
    await page
      .getByRole("textbox", { name: "Assessment numeric answer" })
      .fill(answer);
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  return answer;
}
test.afterEach(async ({ page }) => {
  await post(page, "delete-account", { confirmation: "DELETE" });
});
test("pacing configuration, answer privacy, saved recovery, ownership, submission and review are real", async ({
  page,
  browser,
}) => {
  await ready(page);
  expect(
    (
      await post(page, "exam/start", {
        mode: "drill",
        section: "math",
        count: 5,
        seconds: 1,
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await post(page, "exam/start", {
        mode: "drill",
        section: "math",
        skill: "words-context",
        count: 5,
        seconds: 180,
      })
    ).status(),
  ).toBe(400);
  await expect(
    page.getByRole("button", { name: "Reading & Writing", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Math", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Pacing skill", exact: true })
    .selectOption("linear-one");
  await page
    .getByRole("combobox", { name: "Pacing difficulty", exact: true })
    .selectOption("hard");
  await page
    .getByRole("button", { name: "Begin timed set", exact: true })
    .click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "There are not enough eligible questions" }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/state")).json()).exams,
  ).toHaveLength(0);
  await page
    .getByRole("button", { name: "Reading & Writing", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Pacing skill", exact: true }),
  ).toHaveValue("");
  await page
    .getByRole("combobox", { name: "Pacing skill", exact: true })
    .selectOption("words-context");
  await page
    .getByRole("combobox", { name: "Pacing difficulty", exact: true })
    .selectOption("hard");
  await page
    .getByRole("button", { name: "Begin timed set", exact: true })
    .click();
  await expect(
    page.getByText("Pacing practice", { exact: true }),
  ).toBeVisible();
  const id = new URL(page.url()).searchParams.get("id")!;
  const data = await (await page.request.get("/api/exam?id=" + id)).json();
  expect(data.questions).toHaveLength(5);
  expect(data.exam.modules[0].durationSeconds).toBe(300);
  expect(data.questions.every((q: Question) => q.difficulty === "hard")).toBe(
    true,
  );
  expect(data).not.toHaveProperty("review");
  for (const q of data.questions) {
    expect(q).not.toHaveProperty("correctAnswer");
    expect(q).not.toHaveProperty("explanation");
  }
  const answer = await answerFirst(page, data);
  await page.getByRole("button", { name: "Mark for review" }).click();
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  const deadline = data.exam.modules[0].deadline;
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Mark for review" }),
  ).toHaveAttribute("aria-pressed", "true");
  const recovered = await (await page.request.get("/api/exam?id=" + id)).json();
  expect(recovered.exam.modules[0].deadline).toBe(deadline);
  expect(recovered.exam.modules[0].answers[data.questions[0].id]).toBe(answer);
  expect(
    (
      await post(page, "tutor", { questionId: data.questions[0].id, level: 0 })
    ).status(),
  ).toBe(409);
  const resumed = await (
    await post(page, "exam/start", {
      mode: "drill",
      section: "rw",
      count: 10,
      seconds: 600,
    })
  ).json();
  expect(resumed.id).toBe(id);
  expect(resumed.resumed).toBe(true);
  const outsider = await browser.newContext({ baseURL: origin });
  try {
    await outsider.request.post("/api/session", {
      headers: { Origin: origin },
      data: {},
    });
    expect((await outsider.request.get("/api/exam?id=" + id)).status()).toBe(
      404,
    );
    expect(
      (
        await outsider.request.post("/api/exam/save", {
          headers: { Origin: origin },
          data: {
            id,
            index: 0,
            questionId: data.questions[0].id,
            answer,
            flag: false,
            note: "",
          },
        })
      ).status(),
    ).toBe(404);
  } finally {
    await outsider.request.post("/api/delete-account", {
      headers: { Origin: origin },
      data: { confirmation: "DELETE" },
    });
    await outsider.close();
  }
  await page.getByRole("button", { name: "Question 1 of 5" }).click();
  await page.getByRole("button", { name: "End timed set" }).click();
  await page.getByRole("button", { name: "Submit & lock set" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your timed set is complete.",
    }),
  ).toBeVisible();
  const complete = await (await page.request.get("/api/exam?id=" + id)).json();
  expect(complete.exam.status).toBe("complete");
  expect(complete.exam.modules[0].correct).toBe(1);
  expect(complete.review).toHaveLength(5);
  expect(complete.review[0].correctAnswer).toBe(answer);
  expect(
    (
      await post(page, "exam/save", {
        id,
        index: 0,
        questionId: data.questions[0].id,
        answer,
        flag: false,
        note: "",
      })
    ).status(),
  ).toBe(409);
  await page.reload();
  const state = await (await page.request.get("/api/state")).json();
  expect(state.attempts).toHaveLength(1);
  expect(state.attempts[0].timingSource).toBe("module-average");
  await page.getByRole("link", { name: "Plan another pacing set" }).click();
  await expect(page.locator(".pacing-history")).toContainText("1 of 5 correct");
});
test("an expired pacing deadline is locked on server read without duplicating saved evidence", async ({
  page,
}) => {
  const data = await begin(page);
  await answerFirst(page, data);
  // Only this run's isolated QA database and this test's own session are adjusted.
  const location = process.env.APTMARK_E2E_DB;
  expect(location).toMatch(/^\.\/data\/e2e-\d+\.sqlite$/);
  const database = new DatabaseSync(path.resolve(location!));
  try {
    const row = database
      .prepare("SELECT data FROM exams WHERE id=? AND user_id=?")
      .get(data.exam.id, data.exam.userId) as { data: string };
    expect(row).toBeTruthy();
    const saved = JSON.parse(row.data) as Exam;
    saved.modules[0].startedAt = new Date(Date.now() - 301000).toISOString();
    saved.modules[0].deadline = new Date(Date.now() - 1000).toISOString();
    database
      .prepare("UPDATE exams SET data=? WHERE id=? AND user_id=?")
      .run(JSON.stringify(saved), saved.id, saved.userId);
  } finally {
    database.close();
  }
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Your timed set is complete.",
    }),
  ).toBeVisible();
  const result = await (
    await page.request.get("/api/exam?id=" + data.exam.id)
  ).json();
  expect(result.exam.status).toBe("complete");
  expect(result.exam.modules[0].correct).toBe(1);
  await page.request.get("/api/exam?id=" + data.exam.id);
  const state = await (await page.request.get("/api/state")).json();
  expect(state.attempts).toHaveLength(1);
  expect(state.attempts[0].seconds).toBe(60);
  expect(state.attempts[0].timingSource).toBe("module-average");
});
test("pacing builder, timed workspace and results are responsive and accessible", async ({
  page,
}) => {
  await ready(page);
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `evidence/pacing-completion/builder-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: /A short warm-up/ }).click();
  await page
    .getByRole("button", { name: "Begin timed set", exact: true })
    .click();
  await expect(
    page.getByText("Pacing practice", { exact: true }),
  ).toBeVisible();
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `evidence/pacing-completion/workspace-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("button", { name: "Question 1 of 5" }).click();
  await page.getByRole("button", { name: "End timed set" }).click();
  await page.getByRole("button", { name: "Submit & lock set" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Your timed set is complete.",
    }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: "evidence/pacing-completion/result-390.png",
    fullPage: true,
  });
});

test("all 11 English skills can assemble, grade and review an owner-scoped timed set", async ({
  page,
}) => {
  await ready(page);
  const state = await (await page.request.get("/api/state")).json();
  const englishSkills = state.skills.filter(
    (skill: { section: string }) => skill.section === "rw",
  );
  expect(englishSkills).toHaveLength(11);
  for (const skill of englishSkills) {
    const start = await post(page, "exam/start", {
      mode: "drill",
      section: "rw",
      skill: skill.id,
      difficulty: "all",
      count: 5,
      seconds: 180,
    });
    expect(start.status()).toBe(200);
    const { id } = await start.json();
    const data = await (await page.request.get("/api/exam?id=" + id)).json();
    expect(data.exam.modules).toHaveLength(1);
    expect(data.questions).toHaveLength(5);
    expect(new Set(data.questions.map((q: Question) => q.id)).size).toBe(5);
    expect(
      data.questions.every(
        (q: Question) => q.section === "rw" && q.skill === skill.id,
      ),
    ).toBe(true);
    const q = data.questions[0];
    expect(q).not.toHaveProperty("correctAnswer");
    expect(q).not.toHaveProperty("explanation");
    const key = bank.find((item) => item.id === q.id)!.correctAnswer;
    expect(
      (
        await post(page, "exam/save", {
          id,
          index: 0,
          questionId: q.id,
          answer: key,
          flag: true,
          note: "Check the evidence before choosing.",
        })
      ).status(),
    ).toBe(200);
    expect((await post(page, "exam/submit", { id, index: 0 })).status()).toBe(
      200,
    );
    const result = await (await page.request.get("/api/exam?id=" + id)).json();
    expect(result.exam.status).toBe("complete");
    expect(result.exam.modules[0].correct).toBe(1);
    expect(result.review).toHaveLength(5);
    expect(result.review[0].correctAnswer).toBe(key);
    expect((await post(page, "exam/submit", { id, index: 0 })).status()).toBe(
      409,
    );
  }
  expect(
    (await (await page.request.get("/api/state")).json()).attempts,
  ).toHaveLength(11);
});

test("submission confirmation supports cancellation, keyboard focus and an actionable save failure", async ({
  page,
}) => {
  await begin(page);
  await page.getByRole("button", { name: "Question 1 of 5" }).click();
  await page
    .getByRole("button", { name: "End timed set", exact: true })
    .click();
  const dialog = page.getByRole("alertdialog", {
    name: "Ready to submit this timed set?",
  });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Return to review" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Question 1 of 5" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Question 1 of 5" }).click();
  await page
    .getByRole("button", { name: "End timed set", exact: true })
    .click();
  await page.route("**/api/exam/save", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Connection interrupted. Try again." }),
    }),
  );
  await page.getByRole("button", { name: "Submit & lock set" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Connection interrupted. Try again.",
  );
  await expect(
    page.getByRole("button", { name: "Submit & lock set" }),
  ).toBeEnabled();
  await page.unroute("**/api/exam/save");
  await page.getByRole("button", { name: "Submit & lock set" }).click();
  await expect(
    page.getByRole("heading", { name: "Your timed set is complete." }),
  ).toBeVisible();
});

test("concurrent start requests reuse one saved session instead of creating competing deadlines", async ({
  page,
}) => {
  await ready(page);
  const payload = {
    mode: "drill",
    section: "rw",
    difficulty: "all",
    count: 5,
    seconds: 300,
  };
  const results = await Promise.all([
    post(page, "exam/start", payload),
    post(page, "exam/start", payload),
  ]);
  expect(results.every((r) => r.status() === 200)).toBe(true);
  const bodies = await Promise.all(results.map((r) => r.json()));
  expect(bodies[0].id).toBe(bodies[1].id);
  expect(bodies.some((body) => body.resumed === true)).toBe(true);
  const state = await (await page.request.get("/api/state")).json();
  expect(state.exams).toHaveLength(1);
});

test("Math workspace tools retain accessible names when their visible labels collapse on mobile", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Math", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Pacing skill", exact: true })
    .selectOption("linear-one");
  await page
    .getByRole("button", { name: "Begin timed set", exact: true })
    .click();
  await expect(
    page.getByText("Pacing practice", { exact: true }),
  ).toBeVisible();
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const name of ["Calculator", "Math reference", "Text size"]) {
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeVisible();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({
      path: `evidence/pacing-completion/math-workspace-${width}.png`,
      fullPage: true,
    });
  }
});
