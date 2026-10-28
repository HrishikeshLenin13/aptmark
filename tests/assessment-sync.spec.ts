import AxeBuilder from "@axe-core/playwright";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { test, expect, type Page } from "@playwright/test";
const origin = "http://127.0.0.1:3001";
async function start(page: Page) {
  await page.goto("/drills");
  await page
    .getByRole("button", { name: "Begin timed set", exact: true })
    .click();
  await expect(
    page.getByText("Pacing practice", { exact: true }),
  ).toBeVisible();
  return new URL(page.url()).searchParams.get("id")!;
}
test.afterEach(async ({ page }) => {
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});
test("a heartbeat never replaces a newer answer while its save is delayed", async ({
  page,
}) => {
  await page.clock.install();
  const id = await start(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false;
  await page.route("**/api/exam/save", async (route) => {
    held = true;
    await gate;
    await route.continue();
  });
  try {
    await page.getByRole("radio").first().check();
    await expect.poll(() => held).toBe(true);
    const heartbeat = page.waitForResponse((response) =>
      response.url().includes("/api/exam?id="),
    );
    await page.clock.fastForward(16000);
    await heartbeat;
    await expect(page.getByRole("radio").first()).toBeChecked();
    expect(
      (await (await page.request.get("/api/exam?id=" + id)).json()).exam
        .modules[0].answers,
    ).toEqual({});
  } finally {
    release();
  }
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
});
test("failed work survives heartbeat reads and can be explicitly retried", async ({
  page,
}) => {
  await page.clock.install();
  const id = await start(page);
  await page.route("**/api/exam/save", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Temporary connection failure." }),
    }),
  );
  await page.getByRole("radio").first().check();
  await page.getByText("Notes", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "Assessment notes" })
    .fill("Keep the claim tied to its evidence.");
  await page.getByRole("button", { name: "Mark for review" }).click();
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
  ).toBeEnabled();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Temporary connection failure." }),
  ).toBeVisible();
  const heartbeat = page.waitForResponse((response) =>
    response.url().includes("/api/exam?id="),
  );
  await page.clock.fastForward(16000);
  await heartbeat;
  await expect(page.getByRole("radio").first()).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
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
      path: `evidence/assessment-sync/retry-${width}.png`,
      fullPage: true,
    });
  }
  await page.unroute("**/api/exam/save");
  await page.getByRole("button", { name: "Retry unsaved changes" }).click();
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  const data = await (await page.request.get("/api/exam?id=" + id)).json();
  expect(Object.values(data.exam.modules[0].answers)).toHaveLength(1);
  expect(Object.values(data.exam.modules[0].notes)).toContain(
    "Keep the claim tied to its evidence.",
  );
  expect(data.exam.modules[0].flags).toHaveLength(1);
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
});

test("a read captured before a newer acknowledged answer cannot roll it back", async ({
  page,
}) => {
  await page.clock.install();
  await start(page);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let held = false,
    intercept = true;
  await page.route("**/api/exam?*", async (route) => {
    if (!intercept) return route.continue();
    intercept = false;
    const response = await route.fetch();
    held = true;
    await gate;
    await route.fulfill({ response });
  });
  try {
    await page.clock.fastForward(16000);
    await expect.poll(() => held).toBe(true);
    await page.getByRole("radio").first().check();
    await expect(
      page.getByText("All changes saved", { exact: true }),
    ).toBeVisible();
    const delivered = page.waitForResponse((response) =>
      response.url().includes("/api/exam?id="),
    );
    release();
    await delivered;
    await expect(page.getByRole("radio").first()).toBeChecked();
  } finally {
    release();
  }
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
});

test("all changes saved waits for the last queued acknowledgement", async ({
  page,
}) => {
  await start(page);
  let releaseOne!: () => void, releaseTwo!: () => void;
  const first = new Promise<void>((resolve) => {
    releaseOne = resolve;
  });
  const second = new Promise<void>((resolve) => {
    releaseTwo = resolve;
  });
  let calls = 0;
  await page.route("**/api/exam/save", async (route) => {
    calls++;
    await (calls === 1 ? first : second);
    await route.continue();
  });
  try {
    await page.getByRole("radio").nth(0).check();
    await expect.poll(() => calls).toBe(1);
    await page.getByRole("radio").nth(1).check();
    releaseOne();
    await expect.poll(() => calls).toBe(2);
    await expect(page.getByText("Saving…", { exact: true })).toBeVisible();
    await expect(
      page.getByText("All changes saved", { exact: true }),
    ).not.toBeVisible();
    await expect(page.getByRole("radio").nth(1)).toBeChecked();
  } finally {
    releaseOne();
    releaseTwo();
  }
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").nth(1)).toBeChecked();
});

test("unsaved work prompts before closing and retries after a connection-restored event", async ({
  page,
}) => {
  await start(page);
  await page.route("**/api/exam/save", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Connection interrupted." }),
    }),
  );
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
  ).toBeEnabled();
  let dialogType = "";
  page.once("dialog", async (dialog) => {
    dialogType = dialog.type();
    await dialog.dismiss();
  });
  await page.close({ runBeforeUnload: true });
  await expect.poll(() => dialogType).toBe("beforeunload");
  expect(page.isClosed()).toBe(false);
  expect(dialogType).toBe("beforeunload");
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.unroute("**/api/exam/save");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(
    page.getByText("All changes saved", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("radio").first()).toBeChecked();
});

test("server expiry locks grading and leaves unsent work inspectable without counting it as a response", async ({
  page,
}) => {
  await page.clock.install();
  const id = await start(page);
  const packet = await (await page.request.get("/api/exam?id=" + id)).json();
  await page.route("**/api/exam/save", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Offline before deadline." }),
    }),
  );
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
  ).toBeEnabled();
  const filename = process.env.APTMARK_E2E_DB;
  expect(filename).toMatch(/^\.\/data\/e2e-\d+\.sqlite$/);
  const db = new DatabaseSync(path.resolve(filename!));
  try {
    const row = db
      .prepare("SELECT data FROM exams WHERE id=? AND user_id=?")
      .get(id, packet.exam.userId) as { data: string };
    const exam = JSON.parse(row.data);
    exam.modules[0].startedAt = new Date(Date.now() - 301000).toISOString();
    exam.modules[0].deadline = new Date(Date.now() - 1000).toISOString();
    db.prepare("UPDATE exams SET data=? WHERE id=? AND user_id=?").run(
      JSON.stringify(exam),
      id,
      packet.exam.userId,
    );
  } finally {
    db.close();
  }
  await page.clock.fastForward(16000);
  await expect(
    page.getByRole("heading", { name: "Your timed set is complete." }),
  ).toBeVisible();
  await expect(
    page.getByText(/Unsent local changes were not graded/),
  ).toBeVisible();
  await page.getByText("View unsent work in this tab", { exact: true }).click();
  await expect(
    page.getByText("Local answer: " + packet.questions[0].options[0], {
      exact: true,
    }),
  ).toBeVisible();
  const closed = await (await page.request.get("/api/exam?id=" + id)).json();
  expect(closed.exam.modules[0].correct).toBe(0);
  expect(
    (await (await page.request.get("/api/state")).json()).attempts,
  ).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
  ).not.toBeVisible();
});

test("unsent expired diagnostic work does not block the next module or become graded evidence", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/drills");
  await expect(
    page.getByRole("button", { name: "Begin timed set", exact: true }),
  ).toBeVisible();
  const response = await page.request.post("/api/exam/start", {
    headers: { Origin: origin },
    data: { mode: "diagnostic" },
  });
  expect(response.status()).toBe(200);
  const { id } = await response.json();
  await page.goto("/exam?id=" + id);
  await expect(
    page.getByText("Short diagnostic", { exact: true }),
  ).toBeVisible();
  const packet = await (await page.request.get("/api/exam?id=" + id)).json();
  await page.route("**/api/exam/save", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Offline before module deadline." }),
    }),
  );
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
  ).toBeEnabled();
  const filename = process.env.APTMARK_E2E_DB;
  expect(filename).toMatch(/^\.\/data\/e2e-\d+\.sqlite$/);
  const db = new DatabaseSync(path.resolve(filename!));
  try {
    const row = db
      .prepare("SELECT data FROM exams WHERE id=? AND user_id=?")
      .get(id, packet.exam.userId) as { data: string };
    const exam = JSON.parse(row.data);
    exam.modules[0].startedAt = new Date(Date.now() - 481000).toISOString();
    exam.modules[0].deadline = new Date(Date.now() - 1000).toISOString();
    db.prepare("UPDATE exams SET data=? WHERE id=? AND user_id=?").run(
      JSON.stringify(exam),
      id,
      packet.exam.userId,
    );
  } finally {
    db.close();
  }
  await page.clock.fastForward(16000);
  await expect(
    page.getByRole("heading", { name: "Math · Module 2" }),
  ).toBeVisible();
  await expect(page.getByText(/A previous module is locked/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry unsaved changes" }),
  ).not.toBeVisible();
  await page.unroute("**/api/exam/save");
  await page.getByRole("button", { name: "Question 1 of 6" }).click();
  await page
    .getByRole("button", { name: "End this module", exact: true })
    .click();
  await page.getByRole("button", { name: "Submit & lock module" }).click();
  await expect(
    page.getByRole("heading", { name: "A clearer starting point." }),
  ).toBeVisible();
  const final = await (await page.request.get("/api/exam?id=" + id)).json();
  expect(final.exam.status).toBe("complete");
  expect(final.exam.modules.map((m: { correct: number }) => m.correct)).toEqual(
    [0, 0],
  );
  expect(
    (await (await page.request.get("/api/state")).json()).attempts,
  ).toHaveLength(0);
});
