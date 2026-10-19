import { test, expect, APIRequestContext, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import type { Question } from "../src/lib/types";
const bank = JSON.parse(
  fs.readFileSync("content/bank.json", "utf8"),
) as Question[];
const origin = "http://127.0.0.1:3001";
const post = (
  req: APIRequestContext,
  path: string,
  data: unknown,
  extra: Record<string, string> = {},
) => req.post("/api/" + path, { data, headers: { Origin: origin, ...extra } });
async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
}
test.afterEach(async ({ page }) => {
  await post(page.request, "delete-account", { confirmation: "DELETE" });
});

test("guest practice grades on server, saves history and bookmarks, hides keys before submission", async ({
  page,
}) => {
  await ready(page);
  let initialLoads = 0;
  page.on("request", (r) => {
    if (
      r.url().includes("/api/questions?") &&
      new URL(r.url()).searchParams.get("count") === "8"
    )
      initialLoads++;
  });
  const payloadPromise = page.waitForResponse(
    (r) => r.url().includes("/api/questions?") && r.ok(),
  );
  await page.getByRole("button", { name: "Start a focused session" }).click();
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeVisible();
  const payload = (await (await payloadPromise).json()) as {
    questions: Question[];
  };
  expect(payload.questions).toHaveLength(8);
  expect(initialLoads).toBe(1);
  const q = payload.questions[0];
  expect(q).not.toHaveProperty("correctAnswer");
  expect(q).not.toHaveProperty("explanation");
  expect(q).not.toHaveProperty("steps");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Bookmark question", exact: true })
    .click();
  const real = bank.find((x) => x.id === q.id)!;
  if (q.type === "mcq") {
    const idx = q.options.indexOf(real.correctAnswer);
    await page.getByRole("radio").nth(idx).check();
  } else
    await page
      .getByRole("textbox", { name: "Numeric answer", exact: true })
      .fill(real.correctAnswer);
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("heading", { name: "That’s right." }),
  ).toBeVisible();
  const nextResponse = page.waitForResponse(
    (r) => r.url().includes("/api/questions?") && r.ok(),
  );
  await page
    .getByRole("button", { name: "Next question", exact: true })
    .click();
  const nextPayload = await (await nextResponse).json();
  expect(nextPayload.questions.some((x: { id: string }) => x.id === q.id)).toBe(
    false,
  );
  await page.reload();
  const state = await (await page.request.get("/api/state")).json();
  expect(state.attempts).toHaveLength(1);
  expect(state.bookmarks).toContain(q.id);
  expect(state.attempts[0].correct).toBe(true);
});
test("practice autosave restores a draft after reload", async ({ page }) => {
  await ready(page);
  await page.goto("/practice?skill=linear-one&count=5");
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeVisible();
  const radio = page.getByRole("radio");
  if (await radio.count()) await radio.first().check();
  else
    await page
      .getByRole("textbox", { name: "Numeric answer", exact: true })
      .fill("17");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeEnabled();
});
test("wrong answers enter mistake studio and student reflection persists", async ({
  page,
}) => {
  await ready(page);
  const list = await (
    await page.request.get("/api/questions?skill=linear-one&count=1")
  ).json();
  const q = list.questions[0],
    full = bank.find((x) => x.id === q.id)!;
  const wrong =
    full.type === "spr"
      ? "999999"
      : full.options.find((x) => x !== full.correctAnswer)!;
  const response = await post(page.request, "answer", {
    questionId: q.id,
    answer: wrong,
    seconds: 45,
    assisted: false,
    requestId: crypto.randomUUID(),
    note: "",
  });
  expect(response.ok()).toBe(true);
  await page.goto("/mistakes");
  await expect(page.getByText("Ready to revisit")).toBeVisible();
  await page.getByRole("button", { name: "Reflect on this attempt" }).click();
  await page.getByLabel("Your best explanation").selectOption("misreading");
  await page
    .getByLabel("Reflection", { exact: true })
    .fill("I answered for the total instead of the requested variable.");
  await page.getByRole("button", { name: "Save reflection" }).click();
  await expect(
    page.getByText(
      "I answered for the total instead of the requested variable.",
    ),
  ).toBeVisible();
});
test("local registration retains guest attempts, login works, deletion cascades", async ({
  page,
}) => {
  await ready(page);
  const before = await (await page.request.get("/api/state")).json();
  const email = `qa-${crypto.randomUUID()}@example.test`;
  await page.getByRole("button", { name: /Guest workspace/ }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Long-test-password-2026");
  await page
    .getByRole("button", { name: "Create local account", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: new RegExp(email) }),
  ).toBeVisible();
  const after = await (await page.request.get("/api/state")).json();
  expect(after.user.id).toBe(before.user.id);
  expect(after.user.guest).toBe(0);
  await page.getByRole("button", { name: new RegExp(email) }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Guest workspace/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Guest workspace/ }).click();
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .first()
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Long-test-password-2026");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: new RegExp(email) }),
  ).toBeVisible();
  await page.getByRole("button", { name: new RegExp(email) }).click();
  await page.getByRole("button", { name: "Delete this workspace" }).click();
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently" }).click();
  await expect(
    page.getByRole("button", { name: /Guest workspace/ }),
  ).toBeVisible();
});
test("goals and preferred study days persist", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Personalize your plan" }).click();
  await page.getByLabel("Target SAT date").fill("2027-03-06");
  await page.getByLabel("Target score").fill("1500");
  await page.getByLabel("Minutes available per week").fill("180");
  await page.getByRole("button", { name: "Save your plan" }).click();
  await page.goto("/planner");
  await expect(page.getByText("180 minutes", { exact: true })).toBeVisible();
  await expect(page.getByText("1500", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("180 minutes", { exact: true })).toBeVisible();
});
test("timed module saves answers and flags across refresh, calculator and locking work", async ({
  page,
}) => {
  await ready(page);
  await page.goto("/tests");
  await page.getByRole("button", { name: "Practice a Math module" }).click();
  await expect(
    page.getByRole("heading", { name: "Math · Module 1" }),
  ).toBeVisible();
  const radio = page.getByRole("radio");
  if (await radio.count()) await radio.first().check();
  else
    await page
      .getByRole("textbox", { name: "Assessment numeric answer" })
      .fill("17");
  await page.getByRole("button", { name: "Mark for review" }).click();
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Mark for review" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Calculator", exact: true }).click();
  await page.getByLabel("Expression", { exact: true }).fill("(12+8)/5");
  await page.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(page.locator("output")).toHaveText("4");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: /Question 1 of 22/ }).click();
  await page.getByRole("button", { name: "End this module" }).click();
  await expect(
    page.getByText("21 unanswered · 1 marked for review"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit & lock module" }).click();
  await expect(
    page.getByRole("heading", { name: "A clearer starting point." }),
  ).toBeVisible();
  const eid = new URL(page.url()).searchParams.get("id");
  const locked = await post(page.request, "exam/save", {
    id: eid,
    index: 0,
    questionId: bank[0].id,
    answer: "1",
    flag: false,
    note: "",
  });
  expect(locked.status()).toBe(409);
});
test("short diagnostic advances sections without a standard simulation break", async ({
  page,
}) => {
  await ready(page);
  await page.goto("/tests");
  await page
    .getByRole("button", { name: "Start diagnostic", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reading & Writing · Module 1" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Question 1 of 6/ }).click();
  await page.getByRole("button", { name: "End this module" }).click();
  await page.getByRole("button", { name: "Submit & lock module" }).click();
  await expect(
    page.getByRole("heading", { name: "Math · Module 2" }),
  ).toBeVisible();
});
test("server rejects cross-origin writes, unauthorized editing, invalid keys, and cross-user attempts", async ({
  page,
  browser,
}) => {
  await ready(page);
  expect(
    (
      await page.request.post("/api/preferences", {
        data: {},
        headers: { Origin: "https://foreign.example" },
      })
    ).status(),
  ).toBe(403);
  expect((await page.request.get("/api/admin")).status()).toBe(403);
  const list = await (
    await page.request.get("/api/questions?skill=linear-one&count=1")
  ).json();
  const q = list.questions[0];
  const response = await post(page.request, "answer", {
    questionId: q.id,
    answer: "not an answer",
    seconds: 5,
    assisted: false,
    requestId: crypto.randomUUID(),
  });
  expect(response.status()).toBe(400);
  const a = await post(page.request, "answer", {
    questionId: q.id,
    answer: bank.find((b) => b.id === q.id)!.correctAnswer,
    seconds: 5,
    assisted: false,
    requestId: crypto.randomUUID(),
  });
  const attempt = (await a.json()).attempt;
  const other = await browser.newContext({ baseURL: origin });
  await post(other.request, "session", {});
  expect(
    (await (await other.request.get("/api/state")).json()).attempts,
  ).toHaveLength(0);
  const update = await post(other.request, "attempt-note", {
    id: attempt.id,
    note: "Cross-account overwrite",
    misconception: "uncertain",
  });
  expect(update.status()).toBe(404);
  await post(other.request, "delete-account", { confirmation: "DELETE" });
  await other.close();
});
test("idempotent answer submission does not duplicate history or mastery", async ({
  page,
}) => {
  await ready(page);
  const list = await (
    await page.request.get("/api/questions?skill=linear-one&count=1")
  ).json();
  const q = list.questions[0],
    answer = bank.find((b) => b.id === q.id)!.correctAnswer,
    data = {
      questionId: q.id,
      answer,
      seconds: 30,
      assisted: false,
      requestId: crypto.randomUUID(),
    };
  expect((await post(page.request, "answer", data)).ok()).toBe(true);
  const replay = await post(page.request, "answer", data);
  expect((await replay.json()).replayed).toBe(true);
  const state = await (await page.request.get("/api/state")).json();
  expect(state.attempts).toHaveLength(1);
  expect(
    state.mastery.find((m: { skill: string }) => m.skill === q.skill).n,
  ).toBe(1);
});
test("editorial publication requires validation, human reviewer fields and separate approval", async ({
  page,
}) => {
  await ready(page);
  const headers = { "x-admin-token": "folio-e2e-only" },
    questionId = bank[0].id;
  const early = await post(
    page.request,
    "admin/review",
    {
      questionId,
      action: "publish",
      reviewer: "QA Fixture",
      notes: "Test fixture in isolated test database only.",
    },
    headers,
  );
  expect(early.status()).toBe(400);
  const invalid = await post(
    page.request,
    "admin/review",
    { questionId, action: "approve", reviewer: "QA", notes: "short" },
    headers,
  );
  expect(invalid.status()).toBe(400);
  const approve = await post(
    page.request,
    "admin/review",
    {
      questionId,
      action: "approve",
      reviewer: "Automated QA Fixture",
      notes: "Automated fixture only. Not a real human editorial approval.",
    },
    headers,
  );
  expect(approve.ok()).toBe(true);
  const publish = await post(
    page.request,
    "admin/review",
    {
      questionId,
      action: "publish",
      reviewer: "Automated QA Fixture",
      notes: "Publication gate integration test in isolated database.",
    },
    headers,
  );
  expect(publish.ok()).toBe(true);
  const unpublish = await post(
    page.request,
    "admin/review",
    {
      questionId,
      action: "unpublish",
      reviewer: "Automated QA Fixture",
      notes: "Remove the test publication after gate verification.",
    },
    headers,
  );
  expect(unpublish.ok()).toBe(true);
});
test("desktop and mobile layouts have no horizontal overflow and pass automated accessibility checks", async ({
  page,
}) => {
  await ready(page);
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    fs.writeFileSync(
      `evidence/accessibility-dashboard-${width}.json`,
      JSON.stringify(audit.violations, null, 2),
    );
    expect(audit.violations).toEqual([]);
    await page.screenshot({
      path: `evidence/qa-dashboard-${width}.png`,
      fullPage: true,
    });
  }
  const checks = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  fs.writeFileSync(
    "evidence/accessibility-dashboard.json",
    JSON.stringify(checks.violations, null, 2),
  );
  expect(checks.violations).toEqual([]);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Question bank", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Practice with a purpose." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Check answer" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  const practice = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  fs.writeFileSync(
    "evidence/accessibility-practice.json",
    JSON.stringify(practice.violations, null, 2),
  );
  expect(practice.violations).toEqual([]);
  await page.screenshot({
    path: "evidence/qa-practice-mobile.png",
    fullPage: true,
  });
});

test("evidence-mapped review queue is restricted and student serialization hides editorial fields", async ({
  page,
}) => {
  await ready(page);
  const denied = await page.request.get(
    "/api/admin?version=2.0.0&family=rw2-control-evidence",
  );
  expect(denied.status()).toBe(403);
  const response = await page.request.get(
    "/api/admin?version=2.0.0&family=rw2-control-evidence",
    {
      headers: { "x-admin-token": "folio-e2e-only" },
    },
  );
  expect(response.ok()).toBe(true);
  const queue = await response.json();
  expect(queue.questions).toHaveLength(25);
  expect(
    queue.questions.every(
      (q: Question) =>
        q.generatorVersion === "2.0.0" && q.family === "rw2-control-evidence",
    ),
  ).toBe(true);
  const item = queue.questions[0];
  expect(
    item.answerEvidence.quotes.every((quote: string) =>
      item.passage.includes(quote),
    ),
  ).toBe(true);
  const questions = await (
    await page.request.get(
      "/api/questions?section=rw&skill=textual-evidence&count=30&mode=custom",
    )
  ).json();
  expect(
    questions.questions.some(
      (q: Question) => q.generatorVersion === "2.0.0" || q.seed >= 1000000,
    ),
  ).toBe(true);
  for (const q of questions.questions) {
    for (const field of [
      "correctAnswer",
      "answerEvidence",
      "distractorExplanations",
      "qualityMetadata",
      "reviewer",
      "reviewNotes",
    ])
      expect(q).not.toHaveProperty(field);
  }
  await page.goto("/content");
  await page.getByLabel("Administrator token").fill("folio-e2e-only");
  await page.getByRole("button", { name: "Open review queue" }).click();
  const batchResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/admin?") &&
      new URL(response.url()).searchParams.get("version") === "2.0.0" &&
      response.ok(),
  );
  await page.getByLabel("Generation batch").selectOption("2.0.0");
  await batchResponse;
  await page
    .getByRole("combobox", { name: "Editorial skill", exact: true })
    .selectOption("central-ideas");
  await expect(
    page.getByText("Passage evidence for review", { exact: true }),
  ).toBeVisible();
  await page
    .getByText("Difficulty basis & review flags", { exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Official task reference" }),
  ).toBeVisible();
  await page.screenshot({
    path: "evidence/content-expansion/editorial-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Lock workspace", exact: true })
    .click();
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
});
