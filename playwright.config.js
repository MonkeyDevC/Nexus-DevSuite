// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const BASE_URL = process.env.FRONTEND_URL || process.env.E2E_FRONTEND_URL || "http://localhost:3000";

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 120000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});

