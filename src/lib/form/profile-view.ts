import type { Answers } from "./schema";
import { BUDGET_BANDS, LEVELS } from "./options";

type Row = { label: string; value: string };
export type Section = { title: string; rows: Row[] };

const label = <T extends readonly { value: string; label: string }[]>(arr: T, v?: string) =>
  arr.find((o) => o.value === v)?.label ?? v ?? "";

const status = (s?: string) => (s === "taken" ? "Taken" : s === "planned" ? "Not yet taken" : "");

// Turns stored answers into labelled rows grouped like the student form.
// Empty values are dropped so coaches only see what the student filled in.
export function profileSections(a: Answers): Section[] {
  const isBachelor = a.program.level === "bachelor";
  const sections: Section[] = [
    {
      title: "Contact",
      rows: [
        { label: "Name", value: a.contact.name },
        { label: "Email", value: a.contact.email },
        { label: "Phone", value: `${a.contact.phoneCode} ${a.contact.phone}` },
        { label: "Location", value: [a.contact.city, a.contact.state, a.contact.country].filter(Boolean).join(", ") },
        { label: "Coach", value: a.contact.coach === "Other" ? a.contact.coachOther : a.contact.coach },
      ],
    },
    {
      title: "Program & intake",
      rows: [
        { label: "Level", value: label(LEVELS, a.program.level) },
        { label: "Intake", value: `${a.program.intakeTerm === "Other" ? a.program.intakeTermOther : a.program.intakeTerm} ${a.program.intakeYear}` },
      ],
    },
    {
      title: "Destinations",
      rows: [
        { label: "Preferred countries", value: a.destinations.countries.map((c, i) => `${i + 1}. ${c}`).join("  ") },
        { label: "Open to other locations", value: a.destinations.openToOther },
        { label: "Reason", value: a.destinations.reason },
      ],
    },
    {
      title: "Tests",
      rows: [
        { label: "Academic test", value: [a.tests.academicTest, status(a.tests.academicStatus)].filter(Boolean).join(" · ") },
        { label: "Academic score", value: a.tests.academicScore },
        { label: a.tests.academicStatus === "planned" ? "Academic target / mock" : "Academic sections", value: a.tests.academicSections },
        { label: "English test", value: [a.tests.englishTest, status(a.tests.englishStatus)].filter(Boolean).join(" · ") },
        { label: "English overall", value: a.tests.englishOverall },
        { label: "English sections", value: a.tests.englishSections },
        { label: "English test date", value: a.tests.englishPlannedDate },
      ],
    },
    {
      title: "Academics",
      rows: [
        { label: isBachelor ? "School" : "College / university", value: a.academics.institution },
        { label: "Curriculum", value: a.academics.curriculum === "Other" ? a.academics.curriculumOther : a.academics.curriculum },
        ...(isBachelor
          ? [
              { label: "Subjects", value: a.academics.subjects },
              { label: "Grades", value: a.academics.grades },
              { label: "AP exams", value: a.academics.apExams },
            ]
          : [
              { label: "Degree", value: a.academics.degree },
              { label: "Specialisation", value: a.academics.specialisation },
              { label: "CGPA", value: a.academics.cgpa ? `${a.academics.cgpa} / ${a.academics.cgpaScale}` : "" },
            ]),
        { label: "Completion", value: a.academics.completionDate },
        { label: "Backlogs / gaps", value: a.academics.backlogs === "Yes" ? `Yes – ${a.academics.backlogsReason}` : a.academics.backlogs },
        { label: "STEM", value: a.academics.stem },
      ],
    },
    {
      title: "Goals & funding",
      rows: [
        { label: "Desired universities", value: a.goals.desiredUniversities },
        { label: "Alternative programs", value: a.goals.alternativePrograms },
        { label: "Funding", value: a.goals.funding },
        { label: "Annual budget", value: label(BUDGET_BANDS, a.goals.budgetBand) },
        { label: "Post-study plans", value: a.goals.postStudyPlans },
        { label: "Work experience", value: [a.goals.workYears && `${a.goals.workYears} yrs`, a.goals.workRoles].filter(Boolean).join(" · ") },
        { label: "Awards", value: a.goals.awards },
        { label: "Passport", value: a.goals.passport },
        { label: "Remarks", value: a.goals.remarks },
      ],
    },
  ];
  return sections.map((s) => ({ ...s, rows: s.rows.filter((r) => r.value && r.value.trim()) }));
}
