import { defineConfig, devices } from "@playwright/test";

const isContinuousIntegration = Boolean(globalThis.process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isContinuousIntegration,
  retries: isContinuousIntegration ? 2 : 0,
  reporter: isContinuousIntegration ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "main-chromium",
      testMatch: /main\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3000",
      },
    },
    {
      name: "admin-chromium",
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3001",
      },
    },
    {
      name: "rest-chromium",
      testMatch: /rest\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
      },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @darb/main dev",
      url: "http://localhost:3000",
      reuseExistingServer: !isContinuousIntegration,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @darb/admin dev",
      url: "http://localhost:3001",
      reuseExistingServer: !isContinuousIntegration,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @darb/rest dev",
      url: "http://localhost:3002",
      reuseExistingServer: !isContinuousIntegration,
      timeout: 120_000,
    },
  ],
});
