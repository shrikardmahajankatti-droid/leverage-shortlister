import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const levelEnum = pgEnum("level", ["bachelor", "master", "phd"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "queued",
  "researching",
  "ready",
  "reviewed",
  "sent",
  "failed",
]);
export const candidateStatusEnum = pgEnum("candidate_status", [
  "pending",
  "searched",
  "extracted",
  "scored",
  "dropped",
]);
export const bucketEnum = pgEnum("bucket", ["ambitious", "target", "safe"]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "dropped",
]);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    coachName: text("coach_name").notNull(),
    studentName: text("student_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    level: levelEnum("level").notNull(),
    intakeTerm: text("intake_term").notNull(),
    intakeYear: integer("intake_year").notNull(),
    answers: jsonb("answers").notNull(),
    resumeUrl: text("resume_url"),
    status: submissionStatusEnum("status").notNull().default("queued"),
  },
  (t) => [index("submissions_created_at_idx").on(t.createdAt)],
);

export const universities = pgTable("universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  officialDomain: text("official_domain").notNull(),
  qsRankBand: text("qs_rank_band"),
  tier: integer("tier").notNull(),
});

export const researchRuns = pgTable("research_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  step: text("step"),
  searchCalls: integer("search_calls").notNull().default(0),
  llmCalls: integer("llm_calls").notNull().default(0),
  error: text("error"),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id")
    .notNull()
    .references(() => researchRuns.id, { onDelete: "cascade" }),
  universityId: uuid("university_id").references(() => universities.id),
  query: text("query"),
  status: candidateStatusEnum("status").notNull().default("pending"),
  dropReason: text("drop_reason"),
});

export const recommendations = pgTable("recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  runId: uuid("run_id").references(() => researchRuns.id, { onDelete: "set null" }),
  university: text("university").notNull(),
  country: text("country"),
  city: text("city"),
  programName: text("program_name"),
  programLink: text("program_link"),
  duration: text("duration"),
  intake: text("intake"),
  startDate: text("start_date"),
  testReq: text("test_req"),
  englishReq: text("english_req"),
  eligibility: text("eligibility"),
  eligibilityLink: text("eligibility_link"),
  documents: text("documents"),
  deadline: text("deadline"),
  applicationFee: text("application_fee"),
  tuitionFee: text("tuition_fee"),
  scholarshipLink: text("scholarship_link"),
  adcomEmail: text("adcom_email"),
  fitScore: integer("fit_score"),
  bucket: bucketEnum("bucket"),
  reason: text("reason"),
  sources: jsonb("sources"),
  reviewStatus: reviewStatusEnum("review_status").notNull().default("pending"),
  counsellorNote: text("counsellor_note"),
  sortOrder: integer("sort_order"),
});

export const pageCache = pgTable("page_cache", {
  url: text("url").primaryKey(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  text: text("text"),
  extracted: jsonb("extracted"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

// Fixed-window rate limiting (coach login, submissions). Keyed by "<bucket>:<ip>".
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull().default(0),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
