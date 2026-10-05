import { describe, expect, it } from "vitest";
import bachelor from "../fixtures/student-bachelor.json";
import master from "../fixtures/student-master.json";
import { answersSchema, submissionPayloadSchema } from "@/lib/form/schema";

const clone = <T>(v: T): T => structuredClone(v);

describe("answersSchema", () => {
  it("accepts the bachelor fixture", () => {
    const r = answersSchema.safeParse(bachelor);
    expect(r.error?.issues).toBeUndefined();
    expect(r.success).toBe(true);
  });

  it("accepts the master fixture", () => {
    const r = answersSchema.safeParse(master);
    expect(r.error?.issues).toBeUndefined();
    expect(r.success).toBe(true);
  });

  it.each([
    ["contact", "name"],
    ["contact", "email"],
    ["contact", "phone"],
    ["contact", "coach"],
    ["program", "level"],
    ["program", "intakeYear"],
    ["destinations", "openToOther"],
    ["tests", "academicTest"],
    ["tests", "englishTest"],
    ["academics", "institution"],
    ["academics", "completionDate"],
    ["goals", "funding"],
    ["goals", "budgetBand"],
    ["goals", "passport"],
  ] as const)("rejects missing %s.%s", (step, field) => {
    const data = clone(bachelor) as Record<string, Record<string, unknown>>;
    delete data[step][field];
    const r = answersSchema.safeParse(data);
    expect(r.success).toBe(false);
    expect(r.error!.issues.some((i) => i.path[0] === step && i.path[1] === field)).toBe(true);
  });

  it("rejects an empty country list", () => {
    const data = clone(bachelor);
    data.destinations.countries = [];
    expect(answersSchema.safeParse(data).success).toBe(false);
  });

  it("requires a score when the academic test is already taken", () => {
    const data = clone(bachelor);
    data.tests.academicScore = "";
    const r = answersSchema.safeParse(data);
    expect(r.error!.issues[0].path).toEqual(["tests", "academicScore"]);
  });

  it("requires CGPA for master's applicants", () => {
    const data = clone(master);
    data.academics.cgpa = "";
    const r = answersSchema.safeParse(data);
    expect(r.error!.issues[0].path).toEqual(["academics", "cgpa"]);
  });

  it("requires subjects and grades for bachelor's applicants", () => {
    const data = clone(bachelor);
    data.academics.grades = "";
    const r = answersSchema.safeParse(data);
    expect(r.error!.issues[0].path).toEqual(["academics", "grades"]);
  });

  it("requires a name when coach is Other", () => {
    const data = clone(master);
    data.contact.coachOther = "";
    expect(answersSchema.safeParse(data).success).toBe(false);
  });
});

describe("submissionPayloadSchema", () => {
  it("wraps answers with an optional honeypot", () => {
    expect(submissionPayloadSchema.safeParse({ answers: bachelor }).success).toBe(true);
  });
});
