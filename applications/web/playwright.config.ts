import { defineConfig, devices } from "@playwright/test";
import { randomIp } from "./e2e/random-ip";

// The tests run against an already running app (they do not start it).
// Default: the Docker stack on :3000. For `pnpm dev` use E2E_BASE_URL=http://localhost:5173
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    extraHTTPHeaders: { "X-Forwarded-For": randomIp() },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
