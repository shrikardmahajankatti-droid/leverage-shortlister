import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { get } from "@vercel/blob";
import { z } from "zod";
import { db, schema } from "@/db";

// Streams the private resume blob to an authenticated coach (middleware-guarded).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [row] = await db()
    .select({ url: schema.submissions.resumeUrl, name: schema.submissions.studentName })
    .from(schema.submissions)
    .where(eq(schema.submissions.id, id));
  if (!row?.url) return NextResponse.json({ error: "No resume" }, { status: 404 });

  const file = await get(row.url, { access: "private" });
  if (!file) return NextResponse.json({ error: "Resume not found in storage" }, { status: 404 });

  const ext = row.url.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
  const safeName = row.name.replace(/[^\w .-]+/g, "").trim() || "student";
  return new Response(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType ?? "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeName} Resume.${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
