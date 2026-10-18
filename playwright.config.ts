import { defineConfig, devices } from "@playwright/test";
const testDatabase = `./data/e2e-${Date.now()}.sqlite`;
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 1000 },
      },
    },
  ],
  webServer: {
    command: `NEXT_DIST_DIR=.next-e2e CONTENT_PREVIEW=true DATABASE_PATH=${testDatabase} ADMIN_TOKEN=folio-e2e-only npm run dev -- --port 3001`,
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
