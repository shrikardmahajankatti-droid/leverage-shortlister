"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coach/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        const next = params.get("next");
        router.replace(next && next.startsWith("/coach") ? next : "/coach");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Login failed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label htmlFor="passcode" className="block text-sm font-medium text-slate-800">
        Team passcode
      </label>
      <input
        id="passcode"
        type="password"
        autoComplete="current-password"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? "login-err" : undefined}
        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base focus:border-blue-700 focus:ring-2 focus:ring-blue-700/30 focus:outline-none"
      />
      {error && (
        <p id="login-err" role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || !passcode}
        className="mt-4 min-h-12 w-full rounded-lg bg-blue-700 text-base font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
