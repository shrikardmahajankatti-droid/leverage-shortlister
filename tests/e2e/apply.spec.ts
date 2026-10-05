import { test, expect, type Page } from "@playwright/test";
import { bypassHeaders, sql, useBypass } from "./helpers";
import path from "node:path";
import { readFileSync } from "node:fs";

const SHOTS = "test-results/screens";
const stamp = Date.now();
const email = `e2e+${stamp}@example.com`;
const name = `E2E Test Student ${stamp}`;

useBypass();

const pick = (page: Page, group: RegExp | string, option: string) =>
  page.getByRole("group", { name: group }).getByText(option, { exact: true }).click();

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true }).click();

const expectStep = (page: Page, n: number, title: string) =>
  Promise.all([
    expect(page.getByText(`Step ${n} of 6`)).toBeVisible(),
    expect(page.getByRole("heading", { level: 2, name: title })).toBeVisible(),
  ]);

test.afterAll(async () => {
  // Keep the coach inbox clean: remove the row this test created.
  await sql()`delete from submissions where email = ${email}`;
});

test("student completes all 6 steps and the submission is saved", async ({ page }) => {
  await page.goto("/apply");
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Step 1: validation blocks an empty step
  await expectStep(page, 1, "Contact");
  await next(page);
  await expect(page.getByText("Please enter your full name")).toBeVisible();

  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Phone", exact: true }).fill("9000000099");
  await page.getByLabel("Current city").fill("Pune");
  await page.getByLabel("State").fill("Maharashtra");
  await page.getByLabel("Your coach").selectOption("Counsellor A");
  await page.screenshot({ path: `${SHOTS}/step-1-contact.png`, fullPage: true });
  await next(page);

  // Step 2
  await expectStep(page, 2, "Program & intake");
  await pick(page, /Which level/, "Bachelor's");
  await pick(page, /Intake round/, "Fall");
  await page.getByLabel("Intake year").selectOption(String(new Date().getFullYear() + 1));
  await page.screenshot({ path: `${SHOTS}/step-2-program.png`, fullPage: true });
  await next(page);

  // Step 3
  await expectStep(page, 3, "Destinations");
  await page.getByRole("button", { name: "Canada", exact: true }).click();
  await page.getByRole("button", { name: "USA", exact: true }).click();
  await page.getByRole("button", { name: "Move USA up" }).click();
  await expect(page.getByRole("listitem").first()).toContainText("1. USA");
  await pick(page, /Open to other/, "Maybe");
  await page.getByLabel("Why these countries?").fill("Strong CS programs");
  await page.screenshot({ path: `${SHOTS}/step-3-destinations.png`, fullPage: true });
  await next(page);

  // Step 4
  await expectStep(page, 4, "Tests");
  await page.getByLabel("Academic test").selectOption("SAT");
  await pick(page, /Have you taken the SAT/, "Already taken");
  await page.getByLabel("Total score").fill("1450");
  await page.getByLabel("English test").selectOption("IELTS");
  await pick(page, /Have you taken the IELTS/, "Already taken");
  await page.getByLabel("Overall score").fill("7.0");
  await page.screenshot({ path: `${SHOTS}/step-4-tests.png`, fullPage: true });
  await next(page);

  // Step 5
  await expectStep(page, 5, "Academics");
  await page.getByLabel("Last school attended").fill("Example Public School");
  await page.getByLabel("Curriculum / board").selectOption("CBSE");
  await page.getByLabel("Subjects").fill("Physics, Chemistry, Maths, CS");
  await page.getByLabel("Predicted or final grades").fill("Class 12 predicted: 92%");
  await page.getByLabel("Completion date (month & year)").fill("2027-03");
  await pick(page, /backlogs or gap/, "No");
  await pick(page, /STEM/, "Yes");
  await page.screenshot({ path: `${SHOTS}/step-5-academics.png`, fullPage: true });
  await next(page);

  // Step 6
  await expectStep(page, 6, "Goals & funding");
  await page.getByLabel("Universities and programs you have in mind").fill("University of Toronto – CS");
  await pick(page, /How will you fund/, "Mix");
  await page.getByLabel("Annual budget (tuition + living)").selectOption("25-40");
  await pick(page, /valid passport/, "Yes");
  await page.getByLabel(/^Resume/).setInputFiles(path.join(__dirname, "../fixtures/resume-sample.pdf"));
  await expect(page.getByText("Uploaded resume-sample.pdf")).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: `${SHOTS}/step-6-goals.png`, fullPage: true });

  // Back keeps answers
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Subjects")).toHaveValue("Physics, Chemistry, Maths, CS");
  await next(page);

  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.waitForURL("**/thank-you");
  await expect(
    page.getByText("Thank you for your response. The team will get back to you shortly."),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/thank-you.png`, fullPage: true });

  const rows = (await sql()`
    select student_name, level, intake_term, coach_name, status, resume_url, answers
    from submissions where email = ${email}`) as Record<string, unknown>[];
  expect(rows).toHaveLength(1);
  const r = rows[0] as {
    student_name: string;
    level: string;
    intake_term: string;
    coach_name: string;
    status: string;
    resume_url: string | null;
    answers: { destinations: { countries: string[] } };
  };
  expect(r.student_name).toBe(name);
  expect(r.level).toBe("bachelor");
  expect(r.intake_term).toBe("Fall");
  expect(r.coach_name).toBe("Counsellor A");
  expect(r.status).toBe("queued");
  expect(r.resume_url).toMatch(/blob\.vercel-storage\.com\/resumes\//);
  expect(r.answers.destinations.countries).toEqual(["USA", "Canada"]);
});

test("honeypot submissions are accepted silently but not stored", async ({ request }) => {
  const hpEmail = `hp+${stamp}@example.com`;
  const fixture = JSON.parse(readFileSync(path.join(__dirname, "../fixtures/student-bachelor.json"), "utf8"));
  const res = await request.post("/api/submissions", {
    headers: bypassHeaders,
    data: { answers: { ...fixture, contact: { ...fixture.contact, email: hpEmail } }, website: "spam.example" },
  });
  expect(res.status()).toBe(201);
  const rows = await sql()`select 1 from submissions where email = ${hpEmail}`;
  expect(rows).toHaveLength(0);
});

test("invalid payload is rejected with 400", async ({ request }) => {
  const res = await request.post("/api/submissions", {
    headers: bypassHeaders,
    data: { answers: { contact: {} } },
  });
  expect(res.status()).toBe(400);
});
