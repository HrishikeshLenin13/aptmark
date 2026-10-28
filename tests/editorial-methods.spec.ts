import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import type { Question } from "../src/lib/types";
const methodCatalog = (
  JSON.parse(fs.readFileSync("content/bank.json", "utf8")) as Question[]
).filter((q) => q.generatorVersion === "3.0.0");
const familyIds = [...new Set(methodCatalog.map((q) => q.family))].sort(
  (a, b) => a.localeCompare(b, "en"),
);
const catalogCounts = {
  matching: methodCatalog.length,
  pending: methodCatalog.filter((q) => q.editorialStatus === "pending").length,
  approved: methodCatalog.filter((q) => q.editorialStatus === "approved")
    .length,
  published: methodCatalog.filter((q) => q.publicationStatus === "published")
    .length,
};
const origin = "http://127.0.0.1:3001";
const admin = { "x-admin-token": "folio-e2e-only" };
const heldReplies = new Set<() => void>();
async function open(page: Page) {
  await page.goto("/content");
  await page.getByLabel("Administrator token").fill("folio-e2e-only");
  await page
    .getByRole("button", { name: "Open review queue", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Generation batch", exact: true }),
  ).toHaveValue("3.0.0");
  await expect(
    page.getByRole("region", { name: "Method & structure", exact: true }),
  ).toBeVisible();
}
async function frames(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
test.afterEach(async ({ page }) => {
  for (const release of heldReplies) release();
  heldReplies.clear();
  await page.request.post("/api/delete-account", {
    headers: { Origin: origin },
    data: { confirmation: "DELETE" },
  });
});

test("catalog metadata is restricted, complete across pages and scoped before family pagination", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A fresh page. A stronger start." }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin?version=3.0.0")).status()).toBe(
    403,
  );
  const first = await (
    await page.request.get("/api/admin?version=3.0.0", { headers: admin })
  ).json();
  expect(first.questions).toHaveLength(50);
  expect(first.families).toHaveLength(familyIds.length);
  expect(first.counts).toEqual(catalogCounts);
  expect(first.families.map((family: { id: string }) => family.id)).toEqual(
    familyIds,
  );
  const lastFamily = first.families.at(-1);
  const family = await (
    await page.request.get(`/api/admin?version=3.0.0&family=${lastFamily.id}`, {
      headers: admin,
    })
  ).json();
  expect(family.questions).toHaveLength(4);
  expect(
    family.questions.every(
      (q: { family: string }) => q.family === lastFamily.id,
    ),
  ).toBe(true);
  expect(family.families).toHaveLength(familyIds.length);
  expect(family.pagination.hasNext).toBe(false);
  const second = await (
    await page.request.get("/api/admin?version=3.0.0&offset=50", {
      headers: admin,
    })
  ).json();
  expect(second.pagination.total).toBe(methodCatalog.length);
  expect(
    second.questions.some((q: { id: string }) =>
      first.questions.some((p: { id: string }) => p.id === q.id),
    ),
  ).toBe(false);
  const empty = await (
    await page.request.get("/api/admin?version=3.0.0&family=missing", {
      headers: admin,
    })
  ).json();
  expect(empty.questions).toEqual([]);
  expect(empty.counts.matching).toBe(0);
  const selected = first.questions[0];
  await page.request.post("/api/bookmark", {
    headers: { Origin: origin },
    data: { questionId: selected.id },
  });
  const publicResult = await (
    await page.request.get(
      `/api/questions?mode=bookmarks&count=1&skill=${selected.skill}`,
    )
  ).json();
  for (const field of [
    "solutionMethod",
    "families",
    "counts",
    "answerEvidence",
    "correctAnswer",
    "distractorExplanations",
  ])
    expect(publicResult.questions[0]).not.toHaveProperty(field);
});

test("method families, steps and evidence are reviewable without carrying notes into another item", async ({
  page,
}) => {
  await page.goto("/content");
  await expect(
    page.getByRole("region", { name: "Method & structure", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Administrator token").fill("wrong-token");
  await page
    .getByRole("button", { name: "Open review queue", exact: true })
    .click();
  await expect(page.locator("#main-content").getByRole("alert")).toBeVisible();
  await page.getByLabel("Administrator token").fill("folio-e2e-only");
  await page
    .getByRole("button", { name: "Open review queue", exact: true })
    .click();
  const region = page.getByRole("region", {
    name: "Method & structure",
    exact: true,
  });
  await expect(region).toBeVisible();
  await expect(
    page
      .getByRole("combobox", { name: "Editorial family", exact: true })
      .locator("option"),
  ).toHaveCount(familyIds.length + 1);
  await page
    .getByRole("combobox", { name: "Editorial family", exact: true })
    .selectOption("rw3-unbroken-core-clause");
  await expect(page.locator(".editor-queue button")).toHaveCount(4);
  await expect(region).toContainText("rw3-unbroken-core-clause");
  await expect(
    region.getByRole("heading", { name: "Reasoning steps to verify" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Next batch", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Previous batch", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Named human reviewer").fill("QA read-only observer");
  await page
    .getByRole("textbox", { name: "Review notes", exact: true })
    .fill("Draft note only; this test records no editorial decision.");
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Publish approved item", exact: true }),
  ).toBeDisabled();
  await page.locator(".editor-queue button").nth(1).click();
  await expect(
    page.getByRole("textbox", { name: "Review notes", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByRole("button", { name: "Approve", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Generation batch").selectOption("1.0.0");
  await expect(
    page.getByRole("combobox", { name: "Editorial family", exact: true }),
  ).toHaveValue("");
  await expect(
    page.getByText(/This generation has no recorded method blueprint/),
  ).toBeVisible();
  await page.getByLabel("Generation batch").selectOption("3.0.0");
  await page
    .getByLabel("Editorial skill", { exact: true })
    .selectOption("linear-one");
  await expect(
    page.getByText("No candidates match this filter.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Show English method catalog", exact: true })
    .click();
  await expect(region).toBeVisible();
  await expect(page.getByLabel("Editorial skill", { exact: true })).toHaveValue(
    "",
  );
  await page
    .getByRole("button", { name: "Lock workspace", exact: true })
    .click();
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
  await expect(region).toHaveCount(0);
});

test("out-of-order real responses cannot replace the newest filter or reopen a locked review workspace", async ({
  page,
}) => {
  await open(page);
  let releaseFirst!: () => void;
  let signalFirst!: () => void;
  const firstStarted = new Promise<void>((resolve) => {
    signalFirst = resolve;
  });
  const firstHeld = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  heldReplies.add(releaseFirst);
  await page.route("**/api/admin?**", async (route) => {
    if (
      new URL(route.request().url()).searchParams.get("skill") ===
      "central-ideas"
    ) {
      const response = await route.fetch();
      signalFirst();
      await firstHeld;
      await route.fulfill({ response });
    } else await route.continue();
  });
  await page
    .getByLabel("Editorial skill", { exact: true })
    .selectOption("central-ideas");
  await firstStarted;
  await expect(
    page.getByRole("textbox", { name: "Review notes", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Editorial skill", { exact: true })
    .selectOption("inferences");
  await expect(page.locator(".editor-queue button").first()).toContainText(
    "inferences-",
  );
  await page
    .getByRole("textbox", { name: "Review notes", exact: true })
    .fill("Notes belong only to the current inference candidate.");
  const stale = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/admin" &&
      new URL(r.url()).searchParams.get("skill") === "central-ideas",
  );
  releaseFirst();
  await (await stale).finished();
  await frames(page);
  await expect(page.locator(".editor-queue button").first()).toContainText(
    "inferences-",
  );
  await expect(
    page.getByRole("textbox", { name: "Review notes", exact: true }),
  ).toHaveValue("Notes belong only to the current inference candidate.");
  await page.unroute("**/api/admin?**");
  let releaseLocked!: () => void;
  let signalLocked!: () => void;
  const lockedStarted = new Promise<void>((resolve) => {
    signalLocked = resolve;
  });
  const lockedHeld = new Promise<void>((resolve) => {
    releaseLocked = resolve;
  });
  heldReplies.add(releaseLocked);
  await page.route("**/api/admin?**", async (route) => {
    const response = await route.fetch();
    signalLocked();
    await lockedHeld;
    await route.fulfill({ response });
  });
  await page
    .getByLabel("Editorial skill", { exact: true })
    .selectOption("words-context");
  await lockedStarted;
  await page
    .getByRole("button", { name: "Lock workspace", exact: true })
    .click();
  const locked = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/admin" &&
      new URL(r.url()).searchParams.get("skill") === "words-context",
  );
  releaseLocked();
  await (await locked).finished();
  await frames(page);
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
  await expect(
    page.getByRole("region", { name: "Method & structure", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("combobox", { name: "Editorial family", exact: true }),
  ).toHaveCount(0);
});

test("editorial methods and controls retain keyboard access and readable mobile/tablet/desktop layouts", async ({
  page,
}) => {
  test.setTimeout(90000);
  await open(page);
  await page
    .getByLabel("Editorial family", { exact: true })
    .selectOption("rw3-table-denominator");
  await expect(page.locator(".editor-queue button")).toHaveCount(4);
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByRole("region", { name: "Method & structure", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `evidence/editorial-methods/review-${width}.png`,
      fullPage: true,
    });
    if (width !== 820) {
      await page
        .getByRole("region", { name: "Method & structure", exact: true })
        .screenshot({ path: `evidence/editorial-methods/method-${width}.png` });
    }
  }
  const family = page.getByLabel("Editorial family", { exact: true });
  await family.focus();
  await expect(family).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Lock workspace", exact: true }),
  ).toBeFocused();
});

test("locking during held review writes restores controls and ignores stale mutation callbacks", async ({
  page,
}) => {
  await open(page);
  const gates = Array.from({ length: 2 }, () => {
    let release!: () => void;
    let signal!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    const started = new Promise<void>((resolve) => {
      signal = resolve;
    });
    heldReplies.add(release);
    return { release, signal, held, started };
  });
  let writes = 0;
  await page.route("**/api/admin/review", async (route) => {
    const gate = gates[writes++];
    gate.signal();
    await gate.held;
    // No upstream delivery or fabricated review response: neither write
    // records an editorial decision in the isolated test database.
    await route.abort("failed");
  });
  const unlock = async () => {
    await page.getByLabel("Administrator token").fill("folio-e2e-only");
    await page
      .getByRole("button", { name: "Open review queue", exact: true })
      .click();
    await expect(
      page.getByRole("region", { name: "Method & structure", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Editorial skill", { exact: true }),
    ).toBeEnabled();
    await expect(
      page.getByLabel("Editorial family", { exact: true }),
    ).toBeEnabled();
  };
  const submitBlocked = async (index: number) => {
    await page
      .getByLabel("Named human reviewer", { exact: true })
      .fill("E2E network fixture");
    await page
      .getByRole("textbox", { name: "Review notes", exact: true })
      .fill(
        `Blocked transport ${index}: intentionally aborted before upstream delivery; this must not record a review.`,
      );
    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await gates[index].started;
    await expect(
      page.getByLabel("Editorial skill", { exact: true }),
    ).toBeDisabled();
  };
  const releaseBlocked = async (index: number) => {
    const failed = page.waitForEvent(
      "requestfailed",
      (request) =>
        request.url().endsWith("/api/admin/review") &&
        !!request.postData()?.includes(`Blocked transport ${index}`),
    );
    gates[index].release();
    heldReplies.delete(gates[index].release);
    await failed;
    await frames(page);
  };
  await submitBlocked(0);
  await page
    .getByRole("button", { name: "Lock workspace", exact: true })
    .click();
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
  // Reopen while the first request is still pending, not after it finishes.
  await unlock();
  await expect(
    page.getByRole("textbox", { name: "Review notes", exact: true }),
  ).toHaveValue("");
  await submitBlocked(1);
  await releaseBlocked(0);
  // The old mutation's finally/catch must not unlock the newer mutation.
  await expect(
    page.getByLabel("Editorial skill", { exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("combobox", { name: "Generation batch", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Lock workspace", exact: true })
    .click();
  await releaseBlocked(1);
  await expect(page.getByLabel("Administrator token")).toHaveValue("");
  await unlock();
  await expect(
    page.getByRole("textbox", { name: "Review notes", exact: true }),
  ).toHaveValue("");
  await expect(page.locator("#main-content").getByRole("alert")).toHaveCount(0);
  expect(writes).toBe(2);
  const data = await (
    await page.request.get("/api/admin?version=3.0.0", { headers: admin })
  ).json();
  expect(data.counts).toEqual(catalogCounts);
});
