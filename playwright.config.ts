import { defineConfig, devices } from "@playwright/test";

// Run `npx playwright install --with-deps chromium` once before `npm run test:e2e`.
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3100";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: true,
  reporter: [["list"]],
  use: { baseURL, trace: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next start -p 3100",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000
      }
});
