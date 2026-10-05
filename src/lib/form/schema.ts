import { z } from "zod";
import {
  ACADEMIC_TESTS,
  BUDGET_BANDS,
  COUNTRIES,
  CURRICULA,
  ENGLISH_TESTS,
  FUNDING,
  INTAKE_TERMS,
  YES_NO_MAYBE,
} from "./options";

const req = (msg = "Required") => z.string({ error: msg }).trim().min(1, msg);
const opt = z.string().trim().max(2000).optional().default("");
const values = <T extends readonly { value: string }[]>(arr: T) =>
  arr.map((o) => o.value) as [T[number]["value"], ...T[number]["value"][]];

const thisYear = new Date().getFullYear();

export const contactSchema = z
  .object({
    name: req("Please enter your full name").max(120),
    email: z.email("Please enter a valid email"),
    phoneCode: z.string({ error: "Use a code like +91" }).trim().regex(/^\+\d{1,4}$/, "Use a code like +91"),
    phone: z
      .string({ error: "Please enter a valid phone number" })
      .trim()
      .regex(/^[\d\s-]{6,15}$/, "Please enter a valid phone number"),
    city: req("Please enter your city").max(80),
    state: opt,
    country: req("Please enter your country").max(80),
    coach: req("Please choose your coach"),
    coachOther: opt,
  })
  .superRefine((v, ctx) => {
    if (v.coach === "Other" && !v.coachOther)
      ctx.addIssue({ code: "custom", path: ["coachOther"], message: "Please enter your coach's name" });
  });

export const programSchema = z
  .object({
    level: z.enum(["bachelor", "master", "phd"], { error: "Please choose a level" }),
    intakeTerm: z.enum(INTAKE_TERMS, { error: "Please choose an intake" }),
    intakeTermOther: opt,
    intakeYear: z.coerce
      .number({ error: "Please choose a year" })
      .int()
      .min(thisYear, "Intake year can't be in the past")
      .max(thisYear + 5),
  })
  .superRefine((v, ctx) => {
    if (v.intakeTerm === "Other" && !v.intakeTermOther)
      ctx.addIssue({ code: "custom", path: ["intakeTermOther"], message: "Please describe the intake" });
  });

export const destinationsSchema = z.object({
  countries: z.array(z.enum(COUNTRIES)).min(1, "Pick at least one country").max(COUNTRIES.length),
  openToOther: z.enum(YES_NO_MAYBE, { error: "Please choose one" }),
  reason: opt,
});

export const testsSchema = z
  .object({
    academicTest: z.enum(ACADEMIC_TESTS, { error: "Please choose a test (or None)" }),
    academicStatus: z.enum(["taken", "planned"]).optional(),
    academicScore: opt,
    academicSections: opt,
    englishTest: z.enum(ENGLISH_TESTS, { error: "Please choose a test (or None)" }),
    englishStatus: z.enum(["taken", "planned"]).optional(),
    englishOverall: opt,
    englishSections: opt,
    englishPlannedDate: opt,
  })
  .superRefine((v, ctx) => {
    if (v.academicTest !== "None") {
      if (!v.academicStatus)
        ctx.addIssue({ code: "custom", path: ["academicStatus"], message: "Have you taken it yet?" });
      else if (v.academicStatus === "taken" && !v.academicScore)
        ctx.addIssue({ code: "custom", path: ["academicScore"], message: "Please enter your score" });
    }
    if (v.englishTest !== "None") {
      if (!v.englishStatus)
        ctx.addIssue({ code: "custom", path: ["englishStatus"], message: "Have you taken it yet?" });
      else if (v.englishStatus === "taken" && !v.englishOverall)
        ctx.addIssue({ code: "custom", path: ["englishOverall"], message: "Please enter your overall score" });
    }
  });

// Level is needed to decide which academic fields are required, so the
// academics step is validated together with the program step's level.
export const academicsSchema = z.object({
  institution: req("Please enter your school or college").max(200),
  curriculum: z.enum(CURRICULA, { error: "Please choose one" }),
  curriculumOther: opt,
  subjects: opt,
  grades: opt,
  degree: opt,
  specialisation: opt,
  cgpa: opt,
  cgpaScale: opt,
  completionDate: req("Please enter a month and year"),
  backlogs: z.enum(["Yes", "No"], { error: "Please choose one" }),
  backlogsReason: opt,
  stem: z.enum(["Yes", "No"], { error: "Please choose one" }),
  apExams: opt,
});

export const goalsSchema = z.object({
  desiredUniversities: opt,
  alternativePrograms: opt,
  funding: z.enum(FUNDING, { error: "Please choose one" }),
  budgetBand: z.enum(values(BUDGET_BANDS), { error: "Please choose a budget" }),
  postStudyPlans: opt,
  workYears: opt,
  workRoles: opt,
  awards: opt,
  passport: z.enum(["Yes", "No"], { error: "Please choose one" }),
  resumeUrl: z.url().optional().or(z.literal("")).default(""),
  remarks: opt,
});

export const answersSchema = z
  .object({
    contact: contactSchema,
    program: programSchema,
    destinations: destinationsSchema,
    tests: testsSchema,
    academics: academicsSchema,
    goals: goalsSchema,
  })
  .superRefine((v, ctx) => {
    const issues = academicsLevelIssues(v.program.level, v.academics);
    for (const i of issues) ctx.addIssue({ code: "custom", path: ["academics", i.path], message: i.message });
  });

export function academicsLevelIssues(
  level: string | undefined,
  a: Partial<Record<keyof z.infer<typeof academicsSchema>, string>>,
): { path: string; message: string }[] {
  const out: { path: string; message: string }[] = [];
  if (a.curriculum === "Other" && !a.curriculumOther)
    out.push({ path: "curriculumOther", message: "Please name your curriculum" });
  if (a.backlogs === "Yes" && !a.backlogsReason)
    out.push({ path: "backlogsReason", message: "Please explain briefly" });
  if (level === "bachelor") {
    if (!a.subjects) out.push({ path: "subjects", message: "Please list your subjects" });
    if (!a.grades) out.push({ path: "grades", message: "Please enter your grades" });
  } else if (level === "master" || level === "phd") {
    if (!a.degree) out.push({ path: "degree", message: "Please enter your degree" });
    if (!a.cgpa) out.push({ path: "cgpa", message: "Please enter your CGPA / percentage" });
    if (!a.cgpaScale) out.push({ path: "cgpaScale", message: "Please enter the scale (e.g. 10 or 4)" });
  }
  return out;
}

export const submissionPayloadSchema = z.object({
  answers: answersSchema,
  // Honeypot: real users never see or fill this.
  website: z.string().optional().default(""),
});

export type Answers = z.infer<typeof answersSchema>;
export type AnswersInput = z.input<typeof answersSchema>;

export const STEPS = [
  { key: "contact", title: "Contact", schema: contactSchema },
  { key: "program", title: "Program & intake", schema: programSchema },
  { key: "destinations", title: "Destinations", schema: destinationsSchema },
  { key: "tests", title: "Tests", schema: testsSchema },
  { key: "academics", title: "Academics", schema: academicsSchema },
  { key: "goals", title: "Goals & funding", schema: goalsSchema },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];
