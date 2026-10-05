import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { bypassHeaders, coachLogin, isRemote, sql, useBypass } from "./helpers";

const SHOTS = "test-results/screens";
const stamp = Date.now();
const email = `e2e-coach+${stamp}@example.com`;
const name = `E2E Coach Check ${stamp}`;
const fixture = JSON.parse(readFileSync(path.join(__dirname, "../fixtures/student-bachelor.json"), "utf8"));

useBypass();

let submissionId = "";
let resumeUrl = "";

test.beforeAll(async ({ request }) => {
  const blob = await put("resumes/e2e-coach.pdf", readFileSync(path.join(__dirname, "../fixtures/resume-sample.pdf")), {
    access: "private",
    addRandomSuffix: true,
    contentType: "application/pdf",
  });
  resumeUrl = blob.url;
  // A student submission through the public API (same path as Phase 1's form).
  const res = await request.post("/api/submissions", {
    headers: bypassHeaders,
    data: {
      answers: { ...fixture, contact: { ...fixture.contact, name, email }, goals: { ...fixture.goals, resumeUrl } },
    },
  });
  expect(res.status()).toBe(201);
  submissionId = (await res.json()).id;
});

test.afterAll(async () => {
  await sql()`delete from submissions where email = ${email}`;
  if (resumeUrl) await del(resumeUrl);
});

test("logged-out access to a submission redirects to login", async ({ page }) => {
  await page.goto(`/coach/${submissionId}`);
  await expect(page).toHaveURL(/\/coach\/login\?next=/);
  await expect(page.getByRole("heading", { name: "Coach dashboard" })).toBeVisible();
});

test("logged-out access to the inbox redirects to login", async ({ page }) => {
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/coach\/login/);
});

test("coach API rejects requests without a session", async ({ request }) => {
  const res = await request.patch(`/api/coach/${submissionId}/status`, {
    headers: bypassHeaders,
    data: { status: "reviewed" },
  });
  expect(res.status()).toBe(401);
  const resume = await request.get(`/api/coach/${submissionId}/resume`, { headers: bypassHeaders });
  expect(resume.status()).toBe(401);
});

test("wrong passcode is rejected, correct passcode reaches the inbox", async ({ page }) => {
  await coachLogin(page, "definitely-wrong");
  await expect(page.getByText(/Incorrect passcode/)).toBeVisible();
  await expect(page).toHaveURL(/\/coach\/login/);

  await page.getByLabel("Team passcode").fill(process.env.COACH_PASSCODE!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/coach$/);
  await expect(page.getByRole("heading", { name: "Submissions" })).toBeVisible();
  await expect(page.getByRole("link", { name }).first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/coach-inbox-phone.png`, fullPage: true });
});

test("inbox search and filters, detail page, status changes", async ({ page }) => {
  await coachLogin(page);
  await expect(page).toHaveURL(/\/coach$/);

  await page.getByLabel("Search by student name").fill(`Coach Check ${stamp}`);
  await page.getByLabel("Status").selectOption("queued");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(/q=.*status=queued/);
  await expect(page.getByRole("link", { name }).first()).toBeVisible();

  await page.getByLabel("Status").selectOption("sent");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page.getByText("No submissions match these filters.")).toBeVisible();

  await page.goto(`/coach/${submissionId}`);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("Research not run yet")).toBeVisible();
  await expect(page.getByText("Example Public School, Pune")).toBeVisible();
  await expect(page.getByText("1. USA  2. Canada  3. UK")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/coach-detail-phone.png`, fullPage: true });

  const resume = await page.request.get(`/api/coach/${submissionId}/resume`, { headers: bypassHeaders });
  expect(resume.status()).toBe(200);
  expect(resume.headers()["content-type"]).toContain("application/pdf");
  expect((await resume.body()).subarray(0, 5).toString()).toBe("%PDF-");

  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark sent to student" }).click();
  await expect(page.getByText("Sent", { exact: true })).toBeVisible();
  const [row] = await sql()`select status from submissions where id = ${submissionId}`;
  expect(row.status).toBe("sent");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: `${SHOTS}/coach-detail-desktop.png`, fullPage: true });
  await page.goto("/coach");
  await page.screenshot({ path: `${SHOTS}/coach-inbox-desktop.png`, fullPage: true });

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/coach\/login/);
  await page.goto("/coach");
  await expect(page).toHaveURL(/\/coach\/login/);
});

// Spoofs x-real-ip, which only works against a local server (Vercel sets it itself).
test("login is locked after 5 failed attempts per IP", async ({ request }) => {
  test.skip(isRemote, "IP can't be spoofed on Vercel");
  const ip = `203.0.113.${stamp % 250}`;
  try {
    for (let i = 1; i <= 5; i++) {
      const r = await request.post("/api/coach/login", { headers: { "x-real-ip": ip }, data: { passcode: "nope" } });
      expect(r.status()).toBe(i < 5 ? 401 : 429);
    }
    const blocked = await request.post("/api/coach/login", {
      headers: { "x-real-ip": ip },
      data: { passcode: process.env.COACH_PASSCODE },
    });
    expect(blocked.status()).toBe(429);
  } finally {
    await sql()`delete from rate_limits where key = ${`login:${ip}`}`;
  }
});
