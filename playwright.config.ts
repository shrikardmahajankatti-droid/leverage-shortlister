import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

// BASE_URL points at a deployed preview/production URL; defaults to local dev.
const baseURL = process.env.BASE_URL ?? "http://localhost:3100";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    ...devices["Pixel 7"],
    viewport: { width: 375, height: 812 },
    extraHTTPHeaders: bypass
      ? { "x-vercel-protection-bypass": bypass, "x-vercel-set-bypass-cookie": "true" }
      : undefined,
    trace: "retain-on-failure",
  },
});
