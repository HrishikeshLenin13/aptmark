import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const origin = "http://127.0.0.1:3001";
test.afterEach(async ({ page }) => {
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});
test("lesson checks persist for their owner without changing practice mastery or exposing keys", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Learning center", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little clarity goes a long way." }),
  ).toBeVisible();
  const payload = await (await page.request.get("/api/lessons")).json();
  expect(payload.lessons).toHaveLength(12);
  expect(payload.progress).toEqual([]);
  for (const lesson of payload.lessons) {
    expect(Object.keys(lesson.check).sort()).toEqual(["options", "prompt"]);
  }
  await page
    .getByRole("searchbox", { name: "Find a lesson" })
    .fill("equation in balance");
  await expect(page.locator(".lesson-card")).toHaveCount(1);
  await page.getByRole("link", { name: /Keep an equation in balance/ }).click();
  await expect(
    page.getByRole("heading", { name: "Keep an equation in balance" }),
  ).toBeVisible();
  await page.getByRole("radio", { name: "A 3", exact: true }).check();
  await page
    .getByRole("button", { name: "Check understanding", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A useful distinction to notice." }),
  ).toBeVisible();
  let library = await (await page.request.get("/api/lessons")).json();
  expect(library.progress[0]).toMatchObject({ attempts: 1, completedAt: null });
  await page.getByRole("button", { name: "Try the check again" }).click();
  await page.getByRole("radio", { name: "B 7", exact: true }).check();
  await page
    .getByRole("button", { name: "Check understanding", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "You’ve got the idea." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Completed check", { exact: true }),
  ).toBeVisible();
  library = await (await page.request.get("/api/lessons")).json();
  expect(library.progress[0]).toMatchObject({
    lessonId: "equations-balance",
    version: 1,
    attempts: 2,
  });
  expect(library.progress[0].completedAt).toBeTruthy();
  const state = await (await page.request.get("/api/state")).json();
  expect(state.attempts).toEqual([]);
  expect(state.mastery.every((m: { n: number }) => m.n === 0)).toBe(true);
  const outsider = await browser.newContext({ baseURL: origin });
  try {
    await outsider.request.post("/api/session", {
      headers: { Origin: origin },
      data: {},
    });
    const own = await (await outsider.request.get("/api/lessons")).json();
    expect(own.progress).toEqual([]);
    const invalid = await outsider.request.post("/api/lessons/check", {
      headers: { Origin: origin },
      data: { lessonId: "equations-balance", answer: "invalid" },
    });
    expect(invalid.status()).toBe(400);
    const unknown = await outsider.request.post("/api/lessons/check", {
      headers: { Origin: origin },
      data: { lessonId: "missing", answer: "7" },
    });
    expect(unknown.status()).toBe(404);
  } finally {
    await outsider.request.post("/api/delete-account", {
      headers: { Origin: origin },
      data: { confirmation: "DELETE" },
    });
    await outsider.close();
  }
  await page.getByRole("link", { name: "Try five practice questions" }).click();
  await expect(page).toHaveURL(/skill=linear-one/);
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toBeVisible();
});
test("lesson library and reading layouts remain accessible at mobile, tablet, and desktop widths", async ({
  page,
}) => {
  await page.goto("/learn");
  await expect(
    page.getByRole("heading", { name: "A little clarity goes a long way." }),
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
      path: `evidence/website-studio/lessons-${width}.png`,
      fullPage: true,
    });
  }
  await page.getByRole("searchbox", { name: "Find a lesson" }).fill("qzxzero");
  await expect(
    page.getByRole("heading", { name: "No lessons match yet." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all lessons" }).click();
  await page.getByRole("link", { name: /Use a quadratic’s structure/ }).click();
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
      path: `evidence/website-studio/lesson-detail-${width}.png`,
      fullPage: true,
    });
  }
});
