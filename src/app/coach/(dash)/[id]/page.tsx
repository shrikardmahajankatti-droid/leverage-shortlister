import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import StatusChip from "@/components/coach/StatusChip";
import StatusActions from "@/components/coach/StatusActions";
import { profileSections } from "@/lib/form/profile-view";
import type { Answers } from "@/lib/form/schema";
import { LEVEL_LABEL } from "@/lib/status";

export const metadata: Metadata = { title: "Student – Coach dashboard" };
export const dynamic = "force-dynamic";

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [sub] = await db().select().from(schema.submissions).where(eq(schema.submissions.id, id));
  if (!sub) notFound();

  const sections = profileSections(sub.answers as Answers);
  const submitted = sub.createdAt.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  return (
    <>
      <Link href="/coach" className="text-sm font-medium text-blue-800 hover:underline">← All submissions</Link>
      <div className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{sub.studentName}</h1>
          <p className="mt-1 text-sm text-slate-700">
            {LEVEL_LABEL[sub.level]} · {sub.intakeTerm} {sub.intakeYear} · Coach: {sub.coachName} · Submitted {submitted}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusChip status={sub.status} />
          <StatusActions id={sub.id} status={sub.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="profile-h" className="space-y-4">
          <h2 id="profile-h" className="sr-only">Student profile</h2>
          {sub.resumeUrl && (
            <a
              href={`/api/coach/${sub.id}/resume`}
              target="_blank"
              rel="noopener"
              className="flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-blue-800 hover:bg-slate-50"
            >
              Open resume
            </a>
          )}
          {sections.map((s) => (
            <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold tracking-wide text-slate-600 uppercase">{s.title}</h3>
              <dl className="divide-y divide-slate-100">
                {s.rows.map((r) => (
                  <div key={r.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 py-2 text-sm">
                    <dt className="text-slate-600">{r.label}</dt>
                    <dd className="break-words whitespace-pre-line text-slate-900">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </section>

        <section aria-labelledby="shortlist-h" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:self-start">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 id="shortlist-h" className="text-lg font-semibold text-slate-900">University shortlist</h2>
            <button
              type="button"
              disabled
              title="The AI research pipeline is switched on in the next release"
              className="min-h-11 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Run research
            </button>
          </div>
          <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <p className="font-medium text-slate-800">Research not run yet</p>
            <p className="mt-1 text-sm text-slate-600">
              The AI research pipeline is switched on in the next release. Ranked universities with source links will appear here.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
