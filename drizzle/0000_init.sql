CREATE TYPE "public"."bucket" AS ENUM('ambitious', 'target', 'safe');--> statement-breakpoint
CREATE TYPE "public"."candidate_status" AS ENUM('pending', 'searched', 'extracted', 'scored', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('bachelor', 'master', 'phd');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('queued', 'researching', 'ready', 'reviewed', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"university_id" uuid,
	"query" text,
	"status" "candidate_status" DEFAULT 'pending' NOT NULL,
	"drop_reason" text
);
--> statement-breakpoint
CREATE TABLE "page_cache" (
	"url" text PRIMARY KEY NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"text" text,
	"extracted" jsonb
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"run_id" uuid,
	"university" text NOT NULL,
	"country" text,
	"city" text,
	"program_name" text,
	"program_link" text,
	"duration" text,
	"intake" text,
	"start_date" text,
	"test_req" text,
	"english_req" text,
	"eligibility" text,
	"eligibility_link" text,
	"documents" text,
	"deadline" text,
	"application_fee" text,
	"tuition_fee" text,
	"scholarship_link" text,
	"adcom_email" text,
	"fit_score" integer,
	"bucket" "bucket",
	"reason" text,
	"sources" jsonb,
	"review_status" "review_status" DEFAULT 'pending' NOT NULL,
	"counsellor_note" text,
	"sort_order" integer
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"step" text,
	"search_calls" integer DEFAULT 0 NOT NULL,
	"llm_calls" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"coach_name" text NOT NULL,
	"student_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"level" "level" NOT NULL,
	"intake_term" text NOT NULL,
	"intake_year" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"resume_url" text,
	"status" "submission_status" DEFAULT 'queued' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"city" text NOT NULL,
	"official_domain" text NOT NULL,
	"qs_rank_band" text,
	"tier" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_university_id_universities_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_run_id_research_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."research_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_runs" ADD CONSTRAINT "research_runs_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");