import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, passcodeMatches } from "@/lib/auth/session";
import { clientIp, hit, peek, reset } from "@/lib/rate-limit";

const MAX_FAILURES = 5;
const WINDOW_SECONDS = 15 * 60;

export async function POST(req: NextRequest) {
  const key = `login:${clientIp(req)}`;
  if ((await peek(key, WINDOW_SECONDS)) >= MAX_FAILURES) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait 15 minutes and try again." },
      { status: 429, headers: { "Retry-After": String(WINDOW_SECONDS) } },
    );
  }

  const parsed = z.object({ passcode: z.string().max(200) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success || !(await passcodeMatches(parsed.data.passcode))) {
    const n = await hit(key, WINDOW_SECONDS);
    const left = Math.max(0, MAX_FAILURES - n);
    return NextResponse.json(
      { error: left ? `Incorrect passcode. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many attempts. Please wait 15 minutes and try again." },
      { status: left ? 401 : 429 },
    );
  }

  await reset(key);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
