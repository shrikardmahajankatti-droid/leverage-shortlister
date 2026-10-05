import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import StatusChip from "@/components/coach/StatusChip";
import { LEVEL_LABEL, STATUS_LABEL, SUBMISSION_STATUSES, type SubmissionStatus } from "@/lib/status";

export const metadata: Metadata = { title: "Inbox – Coach dashboard" };
export const dynamic = "force-dynamic";

type SP = Promise<{ status?: string; coach?: string; q?: string }>;

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export default async function InboxPage({ searchParams }: { searchParams: SP }) {
  const { status = "", coach = "", q = "" } = await searchParams;
  const s = schema.submissions;

  const where: SQL[] = [];
  if ((SUBMISSION_STATUSES as readonly string[]).includes(status)) where.push(eq(s.status, status as SubmissionStatus));
  if (coach) where.push(eq(s.coachName, coach));
  if (q.trim()) where.push(ilike(s.studentName, `%${q.trim().replace(/[%_\\]/g, "\\$&")}%`));

  const [rows, coaches] = await Promise.all([
    db()
      .select({
        id: s.id,
        createdAt: s.createdAt,
        studentName: s.studentName,
        coachName: s.coachName,
        level: s.level,
        intakeTerm: s.intakeTerm,
        intakeYear: s.intakeYear,
        status: s.status,
        countries: sql<string[]>`${s.answers} -> 'destinations' -> 'countries'`,
      })
      .from(s)
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(s.createdAt))
      .limit(500),
    db().selectDistinct({ name: s.coachName }).from(s).orderBy(s.coachName),
  ]);

  const filtered = Boolean(status || coach || q);
  const sel = "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900";

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Submissions</h1>
        <p className="text-sm text-slate-600">{rows.length} shown</p>
      </div>

      <form method="get" className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <label className="sr-only" htmlFor="q">Search by student name</label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by student name" className={sel} />
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={status} className={sel}>
          <option value="">All statuses</option>
          {SUBMISSION_STATUSES.map((v) => (
            <option key={v} value={v}>{STATUS_LABEL[v]}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="coach">Coach</label>
        <select id="coach" name="coach" defaultValue={coach} className={sel}>
          <option value="">All coaches</option>
          {coaches.map((c) => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="min-h-11 flex-1 rounded-lg bg-blue-700 px-4 text-base font-semibold text-white">Filter</button>
          {filtered && (
            <Link href="/coach" className="flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-800">Clear</Link>
          )}
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          {filtered ? "No submissions match these filters." : "No submissions yet. Share the /apply link with students to get started."}
        </div>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/coach/${r.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900">{r.studentName}</span>
                    <StatusChip status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    {LEVEL_LABEL[r.level]} · {r.intakeTerm} {r.intakeYear} · {(r.countries ?? []).join(", ")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{r.coachName} · {fmtDate(r.createdAt)}</p>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  {["Student", "Level", "Countries", "Intake", "Coach", "Submitted", "Status"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/coach/${r.id}`} className="font-medium text-blue-800 hover:underline">{r.studentName}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-800">{LEVEL_LABEL[r.level]}</td>
                    <td className="px-4 py-3 text-slate-800">{(r.countries ?? []).join(", ")}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">{r.intakeTerm} {r.intakeYear}</td>
                    <td className="px-4 py-3 text-slate-800">{r.coachName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-800">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
