// Signed coach session cookie: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
// Uses Web Crypto so it runs in both middleware (edge) and Node routes.

export const SESSION_COOKIE = "coach_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function equal(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET is missing or too short");
  return s;
}

export async function createSessionToken(now = Date.now()) {
  const payload = b64url(enc.encode(JSON.stringify({ role: "coach", exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS })));
  return `${payload}.${b64url(await hmac(secret(), payload))}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  try {
    if (!equal(fromB64url(sig), await hmac(secret(), payload))) return false;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { role?: string; exp?: number };
    return data.role === "coach" && typeof data.exp === "number" && data.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}

// Constant-time passcode check (compares HMACs so lengths always match).
export async function passcodeMatches(input: string) {
  const expected = process.env.COACH_PASSCODE;
  if (!expected) return false;
  const [a, b] = await Promise.all([hmac(secret(), `pc:${input}`), hmac(secret(), `pc:${expected}`)]);
  return equal(a, b);
}
