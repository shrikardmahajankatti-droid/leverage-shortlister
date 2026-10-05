import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "./session";

// Defence in depth: middleware already guards /coach/*, pages re-check.
export async function requireCoachPage() {
  const ok = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!ok) redirect("/coach/login");
}

export async function isCoach() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}
