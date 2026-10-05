import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { submissionPayloadSchema } from "@/lib/form/schema";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = submissionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 400 },
    );
  }

  // Honeypot filled: pretend success so bots don't learn to adapt.
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });

  const a = parsed.data.answers;
  if (a.goals.resumeUrl && !isOurBlobUrl(a.goals.resumeUrl)) {
    return NextResponse.json({ error: "Invalid resume URL" }, { status: 400 });
  }

  const [row] = await db()
    .insert(schema.submissions)
    .values({
      coachName: a.contact.coach === "Other" ? a.contact.coachOther : a.contact.coach,
      studentName: a.contact.name,
      email: a.contact.email,
      phone: `${a.contact.phoneCode} ${a.contact.phone}`,
      level: a.program.level,
      intakeTerm: a.program.intakeTerm === "Other" ? a.program.intakeTermOther : a.program.intakeTerm,
      intakeYear: a.program.intakeYear,
      answers: a,
      resumeUrl: a.goals.resumeUrl || null,
      status: "queued",
    })
    .returning({ id: schema.submissions.id });

  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}

function isOurBlobUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(".blob.vercel-storage.com") && u.pathname.startsWith("/resumes/");
  } catch {
    return false;
  }
}
