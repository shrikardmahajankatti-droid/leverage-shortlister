// Edit this list to match the counselling team. "Other" is always offered in the form.
export const COACHES = ["Lakshmi"] as const;

export const LEVELS = [
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "phd", label: "PhD" },
] as const;

export const INTAKE_TERMS = ["Fall", "Spring", "Other"] as const;

export const COUNTRIES = [
  "USA",
  "UK",
  "Canada",
  "Australia",
  "Ireland",
  "Netherlands",
  "Germany",
  "France",
  "Singapore",
  "Hong Kong",
  "China",
  "Japan",
  "UAE",
] as const;

export const YES_NO_MAYBE = ["Yes", "No", "Maybe"] as const;

export const ACADEMIC_TESTS = ["SAT", "ACT", "GRE", "GMAT", "None"] as const;
export const ENGLISH_TESTS = ["IELTS", "TOEFL", "Duolingo", "PTE", "None"] as const;
export const TEST_STATUS = [
  { value: "taken", label: "Already taken" },
  { value: "planned", label: "Not yet taken" },
] as const;

export const CURRICULA = ["CBSE", "ISC", "State Board", "IB", "A-Level", "Other"] as const;

export const FUNDING = ["Self", "Loan", "Scholarship", "Mix"] as const;

export const BUDGET_BANDS = [
  { value: "lt15", label: "Under ₹15 lakh / year" },
  { value: "15-25", label: "₹15–25 lakh / year" },
  { value: "25-40", label: "₹25–40 lakh / year" },
  { value: "40-60", label: "₹40–60 lakh / year" },
  { value: "gt60", label: "Above ₹60 lakh / year" },
] as const;

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
