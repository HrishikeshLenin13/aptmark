import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function ready(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
}
test.afterEach(async ({ page }) => {
  await page.request.post("/api/delete-account", {
    headers: { Origin: "http://127.0.0.1:3001" },
    data: { confirmation: "DELETE" },
  });
});
test("workspace search supports real skill navigation, an empty state, and focus return", async ({
  page,
}) => {
  await ready(page);
  const trigger = page.getByRole("button", {
    name: "Search workspace ⌘ K",
    exact: true,
  });
  await expect(trigger).toHaveAttribute(
    "aria-keyshortcuts",
    "Control+K Meta+K",
  );
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Find your next step" });
  await expect(dialog).toBeVisible();
  const input = page.getByRole("searchbox", {
    name: "Search pages and skills",
  });
  await expect(input).toBeFocused();
  await input.fill("unfindable-zqv");
  await expect(
    dialog.getByRole("heading", { name: "No match yet" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Control+k");
  await input.fill("systems");
  await dialog
    .getByRole("link", { name: /Systems of two linear equations/ })
    .click();
  await expect(page).toHaveURL(/skill=linear-systems/);
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toBeVisible();
});
test("mobile navigation traps focus, closes on Escape, and changes routes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ready(page);
  const trigger = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Workspace navigation" });
  await expect(drawer).toBeVisible();
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await drawer.getByRole("link", { name: "Study plan", exact: true }).click();
  await expect(page).toHaveURL(/\/planner$/);
  await expect(drawer).toHaveCount(0);
  await trigger.click();
  await drawer.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(drawer).toHaveCount(0);
  await expect(
    page.getByRole("dialog", { name: "A plan that fits your life" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("challenge shortcut honors difficulty and readable studio layouts pass automated checks", async ({
  page,
}) => {
  await ready(page);
  for (const width of [1440, 1024, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.screenshot({
      path: `evidence/website-studio/overview-${width}.png`,
      fullPage: true,
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/practice");
  await expect(
    page.getByRole("heading", { name: "Practice with a purpose." }),
  ).toBeVisible();
  await page.screenshot({
    path: "evidence/website-studio/practice-builder.png",
    fullPage: true,
  });
  const response = page.waitForResponse(
    (r) =>
      r.url().includes("/api/questions?") &&
      new URL(r.url()).searchParams.get("difficulty") === "hard" &&
      r.ok(),
  );
  await page.getByRole("link", { name: /A thoughtful challenge/ }).click();
  const payload = await (await response).json();
  expect(payload.questions).toHaveLength(5);
  expect(
    payload.questions.every(
      (q: { difficulty: string }) => q.difficulty === "hard",
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Check answer", exact: true }),
  ).toBeVisible();
});
