import { test, type Page } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

export const sql = () => neon(process.env.DATABASE_URL!);

// Vercel preview protection: send the bypass header only to our own origin.
// Adding it globally breaks the cross-origin Blob upload (CORS preflight).
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
export const bypassHeaders: Record<string, string> | undefined =
  bypass && process.env.BASE_URL ? { "x-vercel-protection-bypass": bypass } : undefined;

export const isRemote = Boolean(process.env.BASE_URL);

export function useBypass() {
  test.beforeEach(async ({ page, baseURL }) => {
    if (!bypassHeaders) return;
    await page.route(`${baseURL}/**`, (route) =>
      route.continue({ headers: { ...route.request().headers(), ...bypassHeaders } }),
    );
  });
}

export async function coachLogin(page: Page, passcode = process.env.COACH_PASSCODE!) {
  await page.goto("/coach/login");
  await page.getByLabel("Team passcode").fill(passcode);
  await page.getByRole("button", { name: "Sign in" }).click();
}
