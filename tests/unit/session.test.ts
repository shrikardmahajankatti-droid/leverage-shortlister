import { beforeAll, describe, expect, it } from "vitest";
import { createSessionToken, passcodeMatches, verifySessionToken, SESSION_TTL_SECONDS } from "@/lib/auth/session";

beforeAll(() => {
  process.env.SESSION_SECRET = "x".repeat(64);
  process.env.COACH_PASSCODE = "correct-horse";
});

describe("session tokens", () => {
  it("round-trips a freshly signed token", async () => {
    expect(await verifySessionToken(await createSessionToken())).toBe(true);
  });

  it("rejects a tampered payload", async () => {
    const [, sig] = (await createSessionToken()).split(".");
    const forged = Buffer.from(JSON.stringify({ role: "coach", exp: 9999999999 })).toString("base64url");
    expect(await verifySessionToken(`${forged}.${sig}`)).toBe(false);
  });

  it("rejects a token signed with another secret", async () => {
    const t = await createSessionToken();
    process.env.SESSION_SECRET = "y".repeat(64);
    expect(await verifySessionToken(t)).toBe(false);
    process.env.SESSION_SECRET = "x".repeat(64);
  });

  it("expires after 7 days", async () => {
    const now = Date.now();
    const t = await createSessionToken(now);
    expect(await verifySessionToken(t, now + (SESSION_TTL_SECONDS - 60) * 1000)).toBe(true);
    expect(await verifySessionToken(t, now + (SESSION_TTL_SECONDS + 60) * 1000)).toBe(false);
  });

  it("rejects garbage", async () => {
    for (const t of [undefined, "", "abc", "a.b", "..."]) expect(await verifySessionToken(t)).toBe(false);
  });
});

describe("passcodeMatches", () => {
  it("accepts only the exact passcode", async () => {
    expect(await passcodeMatches("correct-horse")).toBe(true);
    expect(await passcodeMatches("correct-hors")).toBe(false);
    expect(await passcodeMatches("Correct-horse")).toBe(false);
    expect(await passcodeMatches("")).toBe(false);
  });
});
