import { sql } from "drizzle-orm";
import { db, schema } from "@/db";

// Fixed-window counter stored in Postgres (no extra services on the free tier).
// Returns the count for the current window after incrementing.
export async function hit(key: string, windowSeconds: number) {
  const rl = schema.rateLimits;
  const expired = sql`${rl.windowStart} < now() - make_interval(secs => ${windowSeconds})`;
  const [row] = await db()
    .insert(rl)
    .values({ key, windowStart: sql`now()`, count: 1 })
    .onConflictDoUpdate({
      target: rl.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rl.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${rl.windowStart} end`,
      },
    })
    .returning({ count: rl.count });
  return row.count;
}

export async function peek(key: string, windowSeconds: number) {
  const rl = schema.rateLimits;
  const rows = await db()
    .select({ count: rl.count })
    .from(rl)
    .where(sql`${rl.key} = ${key} and ${rl.windowStart} >= now() - make_interval(secs => ${windowSeconds})`);
  return rows[0]?.count ?? 0;
}

export async function reset(key: string) {
  await db().delete(schema.rateLimits).where(sql`${schema.rateLimits.key} = ${key}`);
}

export function clientIp(req: Request) {
  // On Vercel, x-real-ip is set by the platform and can't be spoofed by the client.
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
