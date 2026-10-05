"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  OrderedMultiSelect,
  RadioGroup,
  SelectField,
  TextArea,
  TextField,
} from "@/components/form/fields";
import {
  ACADEMIC_TESTS,
  BUDGET_BANDS,
  COACHES,
  COUNTRIES,
  CURRICULA,
  ENGLISH_TESTS,
  FUNDING,
  INTAKE_TERMS,
  LEVELS,
  RESUME_MAX_BYTES,
  RESUME_TYPES,
  TEST_STATUS,
  YES_NO_MAYBE,
} from "@/lib/form/options";
import { STEPS, academicsLevelIssues, type StepKey } from "@/lib/form/schema";

type Form = {
  contact: Record<
    "name" | "email" | "phoneCode" | "phone" | "city" | "state" | "country" | "coach" | "coachOther",
    string
  >;
  program: Record<"level" | "intakeTerm" | "intakeTermOther" | "intakeYear", string>;
  destinations: { countries: string[]; openToOther: string; reason: string };
  tests: Record<
    | "academicTest"
    | "academicStatus"
    | "academicScore"
    | "academicSections"
    | "englishTest"
    | "englishStatus"
    | "englishOverall"
    | "englishSections"
    | "englishPlannedDate",
    string
  >;
  academics: Record<
    | "institution"
    | "curriculum"
    | "curriculumOther"
    | "subjects"
    | "grades"
    | "degree"
    | "specialisation"
    | "cgpa"
    | "cgpaScale"
    | "completionDate"
    | "backlogs"
    | "backlogsReason"
    | "stem"
    | "apExams",
    string
  >;
  goals: Record<
    | "desiredUniversities"
    | "alternativePrograms"
    | "funding"
    | "budgetBand"
    | "postStudyPlans"
    | "workYears"
    | "workRoles"
    | "awards"
    | "passport"
    | "resumeUrl"
    | "remarks",
    string
  >;
};

const EMPTY: Form = {
  contact: { name: "", email: "", phoneCode: "+91", phone: "", city: "", state: "", country: "India", coach: "", coachOther: "" },
  program: { level: "", intakeTerm: "", intakeTermOther: "", intakeYear: "" },
  destinations: { countries: [], openToOther: "", reason: "" },
  tests: {
    academicTest: "",
    academicStatus: "",
    academicScore: "",
    academicSections: "",
    englishTest: "",
    englishStatus: "",
    englishOverall: "",
    englishSections: "",
    englishPlannedDate: "",
  },
  academics: {
    institution: "",
    curriculum: "",
    curriculumOther: "",
    subjects: "",
    grades: "",
    degree: "",
    specialisation: "",
    cgpa: "",
    cgpaScale: "",
    completionDate: "",
    backlogs: "",
    backlogsReason: "",
    stem: "",
    apExams: "",
  },
  goals: {
    desiredUniversities: "",
    alternativePrograms: "",
    funding: "",
    budgetBand: "",
    postStudyPlans: "",
    workYears: "",
    workRoles: "",
    awards: "",
    passport: "",
    resumeUrl: "",
    remarks: "",
  },
};

const DRAFT_KEY = "apply-draft-v1";
type Errors = Record<string, string>;

// Empty optional enums ("") must be sent as undefined so Zod treats them as unset.
function toPayload(f: Form) {
  const t = { ...f.tests } as Record<string, string | undefined>;
  if (!t.academicStatus) t.academicStatus = undefined;
  if (!t.englishStatus) t.englishStatus = undefined;
  const clean = <T extends Record<string, unknown>>(o: T) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== "")) as T;
  return {
    contact: clean(f.contact),
    program: clean(f.program),
    destinations: clean(f.destinations),
    tests: clean(t),
    academics: clean(f.academics),
    goals: clean(f.goals),
  };
}

export default function ApplyForm() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [upState, setUpState] = useState<{ status: "idle" | "uploading" | "done" | "error"; msg?: string; name?: string }>({
    status: "idle",
  });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loaded = useRef(false);

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as { form?: Form; step?: number };
        if (d.form) setForm({ ...EMPTY, ...d.form });
        if (typeof d.step === "number") setStep(Math.min(Math.max(d.step, 0), STEPS.length - 1));
      }
    } catch {
      /* storage unavailable or corrupt draft */
    }
    loaded.current = true;
  }, []);

  // Save draft
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step }));
    } catch {
      /* ignore */
    }
  }, [form, step]);

  const set = <K extends StepKey>(k: K, field: keyof Form[K], value: Form[K][keyof Form[K]]) => {
    setForm((f) => ({ ...f, [k]: { ...f[k], [field]: value } }));
    setErrors((e) => {
      const key = `${k}.${String(field)}`;
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const err = (k: StepKey, field: string) => errors[`${k}.${field}`];

  function validateStep(i: number): Errors {
    const { key, schema } = STEPS[i];
    const payload = toPayload(form)[key];
    const out: Errors = {};
    const r = schema.safeParse(payload);
    if (!r.success) {
      for (const issue of r.error.issues) {
        const p = `${key}.${String(issue.path[0])}`;
        if (!out[p]) out[p] = issue.message;
      }
    }
    if (key === "academics") {
      for (const i2 of academicsLevelIssues(form.program.level, form.academics)) {
        const p = `academics.${i2.path}`;
        if (!out[p]) out[p] = i2.message;
      }
    }
    return out;
  }

  function goTo(i: number) {
    setStep(i);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus();
    });
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }
    goTo(step + 1);
  }

  async function submit() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: toPayload(form), website: honeypot }),
      });
      if (res.status === 201) {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        router.push("/thank-you");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { issues?: { path: (string | number)[]; message: string }[]; error?: string };
      if (data.issues?.length) {
        const map: Errors = {};
        for (const i of data.issues) map[`${i.path[1]}.${i.path[2]}`] = i.message;
        setErrors(map);
        const firstStep = STEPS.findIndex((s) => s.key === data.issues![0].path[1]);
        if (firstStep >= 0) goTo(firstStep);
        setSubmitError("Some answers need fixing. Please check the highlighted fields.");
      } else {
        setSubmitError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResume(file: File | undefined) {
    if (!file) return;
    if (!(RESUME_TYPES as readonly string[]).includes(file.type)) {
      setUpState({ status: "error", msg: "Please upload a PDF or DOCX file." });
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setUpState({ status: "error", msg: "File is larger than 5 MB." });
      return;
    }
    setUpState({ status: "uploading", name: file.name });
    try {
      const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
      const blob = await upload(`resumes/${safe}`, file, {
        access: "private",
        handleUploadUrl: "/api/upload",
        contentType: file.type,
      });
      set("goals", "resumeUrl", blob.url);
      setUpState({ status: "done", name: file.name });
    } catch {
      setUpState({ status: "error", msg: "Upload failed. You can try again or skip it." });
    }
  }

  const s = STEPS[step];
  const level = form.program.level;
  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const thisYear = new Date().getFullYear();
  const years = [0, 1, 2, 3].map((d) => String(thisYear + d));

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-baseline justify-between text-sm text-slate-700">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <span>{pct}%</span>
        </div>
        <div
          role="progressbar"
          aria-label="Form progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200"
        >
          <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="mb-5 text-xl font-semibold text-slate-900 outline-none">
        {s.title}
      </h2>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (step < STEPS.length - 1) next();
          else submit();
        }}
      >
        {/* Honeypot: hidden from people and assistive tech */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        {s.key === "contact" && (
          <>
            <TextField name="name" label="Full name" required autoComplete="name" value={form.contact.name} onChange={(v) => set("contact", "name", v)} error={err("contact", "name")} />
            <TextField name="email" label="Email" type="email" inputMode="email" required autoComplete="email" value={form.contact.email} onChange={(v) => set("contact", "email", v)} error={err("contact", "email")} />
            <div className="flex gap-3">
              <div className="w-28 shrink-0">
                <TextField name="phoneCode" label="Code" required inputMode="tel" autoComplete="tel-country-code" value={form.contact.phoneCode} onChange={(v) => set("contact", "phoneCode", v)} error={err("contact", "phoneCode")} />
              </div>
              <div className="flex-1">
                <TextField name="phone" label="Phone" type="tel" inputMode="tel" required autoComplete="tel-national" value={form.contact.phone} onChange={(v) => set("contact", "phone", v)} error={err("contact", "phone")} />
              </div>
            </div>
            <TextField name="city" label="Current city" required autoComplete="address-level2" value={form.contact.city} onChange={(v) => set("contact", "city", v)} error={err("contact", "city")} />
            <TextField name="state" label="State" autoComplete="address-level1" value={form.contact.state} onChange={(v) => set("contact", "state", v)} />
            <TextField name="country" label="Country" required autoComplete="country-name" value={form.contact.country} onChange={(v) => set("contact", "country", v)} error={err("contact", "country")} />
            <SelectField name="coach" label="Your coach" required options={[...COACHES, "Other"]} value={form.contact.coach} onChange={(v) => set("contact", "coach", v)} error={err("contact", "coach")} />
            {form.contact.coach === "Other" && (
              <TextField name="coachOther" label="Coach's name" required value={form.contact.coachOther} onChange={(v) => set("contact", "coachOther", v)} error={err("contact", "coachOther")} />
            )}
          </>
        )}

        {s.key === "program" && (
          <>
            <RadioGroup name="level" label="Which level are you applying for?" required options={LEVELS} value={form.program.level} onChange={(v) => set("program", "level", v)} error={err("program", "level")} />
            <RadioGroup name="intakeTerm" label="Intake round" required options={INTAKE_TERMS} value={form.program.intakeTerm} onChange={(v) => set("program", "intakeTerm", v)} error={err("program", "intakeTerm")} />
            {form.program.intakeTerm === "Other" && (
              <TextField name="intakeTermOther" label="Which intake?" required placeholder="e.g. Winter, Summer" value={form.program.intakeTermOther} onChange={(v) => set("program", "intakeTermOther", v)} error={err("program", "intakeTermOther")} />
            )}
            <SelectField name="intakeYear" label="Intake year" required options={years} value={form.program.intakeYear} onChange={(v) => set("program", "intakeYear", v)} error={err("program", "intakeYear")} />
          </>
        )}

        {s.key === "destinations" && (
          <>
            <OrderedMultiSelect label="Preferred countries" hint="Tap to select, then order them by preference." required options={COUNTRIES} value={form.destinations.countries} onChange={(v) => set("destinations", "countries", v)} error={err("destinations", "countries")} />
            <RadioGroup name="openToOther" label="Open to other locations?" required options={YES_NO_MAYBE} value={form.destinations.openToOther} onChange={(v) => set("destinations", "openToOther", v)} error={err("destinations", "openToOther")} />
            <TextArea name="reason" label="Why these countries?" value={form.destinations.reason} onChange={(v) => set("destinations", "reason", v)} />
          </>
        )}

        {s.key === "tests" && (
          <>
            <SelectField name="academicTest" label="Academic test" required options={ACADEMIC_TESTS} value={form.tests.academicTest} onChange={(v) => set("tests", "academicTest", v)} error={err("tests", "academicTest")} />
            {form.tests.academicTest && form.tests.academicTest !== "None" && (
              <>
                <RadioGroup name="academicStatus" label={`Have you taken the ${form.tests.academicTest}?`} required options={TEST_STATUS} value={form.tests.academicStatus} onChange={(v) => set("tests", "academicStatus", v)} error={err("tests", "academicStatus")} />
                {form.tests.academicStatus === "taken" ? (
                  <>
                    <TextField name="academicScore" label="Total score" required inputMode="numeric" value={form.tests.academicScore} onChange={(v) => set("tests", "academicScore", v)} error={err("tests", "academicScore")} />
                    <TextField name="academicSections" label="Section scores" placeholder="e.g. Math 760, EBRW 690" value={form.tests.academicSections} onChange={(v) => set("tests", "academicSections", v)} />
                  </>
                ) : form.tests.academicStatus === "planned" ? (
                  <TextField name="academicSections" label="Target or mock score" placeholder="e.g. Target 320, mock 312" value={form.tests.academicSections} onChange={(v) => set("tests", "academicSections", v)} />
                ) : null}
              </>
            )}
            <SelectField name="englishTest" label="English test" required options={ENGLISH_TESTS} value={form.tests.englishTest} onChange={(v) => set("tests", "englishTest", v)} error={err("tests", "englishTest")} />
            {form.tests.englishTest && form.tests.englishTest !== "None" && (
              <>
                <RadioGroup name="englishStatus" label={`Have you taken the ${form.tests.englishTest}?`} required options={TEST_STATUS} value={form.tests.englishStatus} onChange={(v) => set("tests", "englishStatus", v)} error={err("tests", "englishStatus")} />
                {form.tests.englishStatus === "taken" ? (
                  <>
                    <TextField name="englishOverall" label="Overall score" required inputMode="decimal" value={form.tests.englishOverall} onChange={(v) => set("tests", "englishOverall", v)} error={err("tests", "englishOverall")} />
                    <TextField name="englishSections" label="Section scores" placeholder="e.g. L 7.5, R 7, W 6.5, S 7" value={form.tests.englishSections} onChange={(v) => set("tests", "englishSections", v)} />
                  </>
                ) : form.tests.englishStatus === "planned" ? (
                  <TextField name="englishPlannedDate" label="Planned test date" type="month" value={form.tests.englishPlannedDate} onChange={(v) => set("tests", "englishPlannedDate", v)} />
                ) : null}
              </>
            )}
          </>
        )}

        {s.key === "academics" && (
          <>
            <TextField name="institution" label={level === "bachelor" ? "Last school attended" : "Last college / university"} required value={form.academics.institution} onChange={(v) => set("academics", "institution", v)} error={err("academics", "institution")} />
            <SelectField name="curriculum" label="Curriculum / board" required options={CURRICULA} value={form.academics.curriculum} onChange={(v) => set("academics", "curriculum", v)} error={err("academics", "curriculum")} />
            {form.academics.curriculum === "Other" && (
              <TextField name="curriculumOther" label="Which curriculum?" required value={form.academics.curriculumOther} onChange={(v) => set("academics", "curriculumOther", v)} error={err("academics", "curriculumOther")} />
            )}
            {level === "bachelor" ? (
              <>
                <TextArea name="subjects" label="Subjects" required placeholder="e.g. Physics, Chemistry, Maths, CS" value={form.academics.subjects} onChange={(v) => set("academics", "subjects", v)} error={err("academics", "subjects")} />
                <TextArea name="grades" label="Predicted or final grades" required placeholder="e.g. Class 10: 94%; Class 12 predicted: 92%" value={form.academics.grades} onChange={(v) => set("academics", "grades", v)} error={err("academics", "grades")} />
                <TextField name="apExams" label="AP exams and scores (if any)" value={form.academics.apExams} onChange={(v) => set("academics", "apExams", v)} />
              </>
            ) : (
              <>
                <TextField name="degree" label="Degree" required placeholder="e.g. B.Tech, B.Com" value={form.academics.degree} onChange={(v) => set("academics", "degree", v)} error={err("academics", "degree")} />
                <TextField name="specialisation" label="Specialisation" value={form.academics.specialisation} onChange={(v) => set("academics", "specialisation", v)} />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <TextField name="cgpa" label="CGPA / %" required inputMode="decimal" value={form.academics.cgpa} onChange={(v) => set("academics", "cgpa", v)} error={err("academics", "cgpa")} />
                  </div>
                  <div className="flex-1">
                    <TextField name="cgpaScale" label="Out of" required inputMode="decimal" placeholder="10, 4 or 100" value={form.academics.cgpaScale} onChange={(v) => set("academics", "cgpaScale", v)} error={err("academics", "cgpaScale")} />
                  </div>
                </div>
              </>
            )}
            <TextField name="completionDate" label="Completion date (month & year)" type="month" required value={form.academics.completionDate} onChange={(v) => set("academics", "completionDate", v)} error={err("academics", "completionDate")} />
            <RadioGroup name="backlogs" label="Any backlogs or gap years?" required options={["Yes", "No"]} value={form.academics.backlogs} onChange={(v) => set("academics", "backlogs", v)} error={err("academics", "backlogs")} />
            {form.academics.backlogs === "Yes" && (
              <TextArea name="backlogsReason" label="Please explain" required value={form.academics.backlogsReason} onChange={(v) => set("academics", "backlogsReason", v)} error={err("academics", "backlogsReason")} />
            )}
            <RadioGroup name="stem" label="Is your background STEM?" required options={["Yes", "No"]} value={form.academics.stem} onChange={(v) => set("academics", "stem", v)} error={err("academics", "stem")} />
          </>
        )}

        {s.key === "goals" && (
          <>
            <TextArea name="desiredUniversities" label="Universities and programs you have in mind" placeholder="e.g. University of Toronto – Computer Science" value={form.goals.desiredUniversities} onChange={(v) => set("goals", "desiredUniversities", v)} />
            <TextArea name="alternativePrograms" label="Alternative programs you'd consider" value={form.goals.alternativePrograms} onChange={(v) => set("goals", "alternativePrograms", v)} />
            <RadioGroup name="funding" label="How will you fund your studies?" required options={FUNDING} value={form.goals.funding} onChange={(v) => set("goals", "funding", v)} error={err("goals", "funding")} />
            <SelectField name="budgetBand" label="Annual budget (tuition + living)" required options={BUDGET_BANDS} value={form.goals.budgetBand} onChange={(v) => set("goals", "budgetBand", v)} error={err("goals", "budgetBand")} />
            <TextArea name="postStudyPlans" label="Plans after graduating" value={form.goals.postStudyPlans} onChange={(v) => set("goals", "postStudyPlans", v)} />
            <div className="flex gap-3">
              <div className="w-28 shrink-0">
                <TextField name="workYears" label="Work exp. (yrs)" inputMode="decimal" value={form.goals.workYears} onChange={(v) => set("goals", "workYears", v)} />
              </div>
              <div className="flex-1">
                <TextField name="workRoles" label="Roles" value={form.goals.workRoles} onChange={(v) => set("goals", "workRoles", v)} />
              </div>
            </div>
            <TextArea name="awards" label="Awards and achievements" value={form.goals.awards} onChange={(v) => set("goals", "awards", v)} />
            <RadioGroup name="passport" label="Do you have a valid passport?" required options={["Yes", "No"]} value={form.goals.passport} onChange={(v) => set("goals", "passport", v)} error={err("goals", "passport")} />

            <div className="mb-5">
              <label htmlFor="resume" className="block text-sm font-medium text-slate-800">
                Resume (PDF or DOCX, max 5 MB)
              </label>
              <input
                id="resume"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => onResume(e.target.files?.[0])}
                aria-describedby="resume-status"
                className="mt-1 block w-full text-base text-slate-800 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-slate-800"
              />
              <p id="resume-status" aria-live="polite" className="mt-1 text-sm text-slate-700">
                {upState.status === "uploading" && `Uploading ${upState.name}…`}
                {upState.status === "done" && `Uploaded ${upState.name}`}
                {upState.status === "idle" && form.goals.resumeUrl && "Resume uploaded"}
                {upState.status === "error" && <span className="text-red-700">{upState.msg}</span>}
              </p>
            </div>

            <TextArea name="remarks" label="Anything else we should know?" value={form.goals.remarks} onChange={(v) => set("goals", "remarks", v)} />
          </>
        )}

        {submitError && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {submitError}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-slate-200 bg-white px-4 py-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="min-h-12 flex-1 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-800"
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || upState.status === "uploading"}
            className="min-h-12 flex-[2] rounded-lg bg-blue-700 px-4 text-base font-semibold text-white disabled:opacity-60"
          >
            {step < STEPS.length - 1 ? "Next" : submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
