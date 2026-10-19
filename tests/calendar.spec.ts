import { test, expect } from "@playwright/test";
import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const origin = "http://127.0.0.1:3001";
test.afterEach(async ({ page }) => {
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});
test("calendar downloads the session owner's real study plan and stays keyboard/mobile accessible", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  const outsider = await browser.newContext({ baseURL: origin });
  try {
    expect((await outsider.request.get("/api/planner/calendar")).status()).toBe(
      401,
    );
    await page.request.post("/api/preferences", {
      headers: { Origin: origin },
      data: {
        testDate: "",
        targetScore: 1400,
        weeklyMinutes: 180,
        days: [0, 2],
      },
    });
    const state = await (await page.request.get("/api/state")).json();
    expect(state.plan).toHaveLength(2);
    await page.getByRole("link", { name: "Study plan", exact: true }).click();
    const download = page.waitForEvent("download");
    await page
      .getByRole("link", { name: "Export calendar", exact: true })
      .click();
    const file = await download;
    expect(file.suggestedFilename()).toBe("aptmark-study-plan.ics");
    const text = fs.readFileSync((await file.path())!, "utf8");
    const unfolded = text.replace(/\r\n /g, "");
    expect(unfolded.split("BEGIN:VEVENT")).toHaveLength(state.plan.length + 1);
    for (const day of state.plan) {
      expect(unfolded).toContain(
        "DTSTART;VALUE=DATE:" + day.date.replace(/-/g, ""),
      );
      expect(unfolded).toContain("SUMMARY:Study: " + day.skill.name);
      expect(unfolded).toContain(`${day.minutes} minutes`);
    }
    expect(text).not.toContain(state.user.id);
    expect(text).not.toContain("mailto:");
    const response = await page.request.get(
      "/api/planner/calendar?userId=not-the-owner",
    );
    expect(response.headers()["content-type"]).toContain("text/calendar");
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(
      (await response.text()).replace(/DTSTAMP:[^\r]+/g, "DTSTAMP:ignored"),
    ).toBe(text.replace(/DTSTAMP:[^\r]+/g, "DTSTAMP:ignored"));
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
        path: `evidence/calendar/planner-${width}.png`,
        fullPage: true,
      });
    }
  } finally {
    await outsider.close();
  }
});
