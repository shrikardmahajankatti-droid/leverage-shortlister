import { describe, expect, it } from "vitest";
import bachelor from "../fixtures/student-bachelor.json";
import master from "../fixtures/student-master.json";
import { profileSections } from "@/lib/form/profile-view";
import { answersSchema } from "@/lib/form/schema";

describe("profileSections", () => {
  it.each([["bachelor", bachelor], ["master", master]])("has unique row labels per section (%s)", (_, fx) => {
    for (const s of profileSections(answersSchema.parse(fx))) {
      const labels = s.rows.map((r) => r.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("drops empty values", () => {
    const rows = profileSections(answersSchema.parse(master)).flatMap((s) => s.rows);
    expect(rows.every((r) => r.value.trim() !== "")).toBe(true);
    expect(rows.find((r) => r.label === "CGPA")?.value).toBe("8.4 / 10");
  });
});
