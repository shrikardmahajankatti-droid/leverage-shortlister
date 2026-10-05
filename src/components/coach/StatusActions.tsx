"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SubmissionStatus } from "@/lib/status";

const ACTIONS: { to: "reviewed" | "sent"; label: string; allowedFrom: SubmissionStatus[] }[] = [
  { to: "reviewed", label: "Mark reviewed", allowedFrom: ["queued", "researching", "ready", "failed", "sent"] },
  { to: "sent", label: "Mark sent to student", allowedFrom: ["reviewed"] },
];

export default function StatusActions({ id, status }: { id: string; status: SubmissionStatus }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function change(to: string) {
    setBusy(to);
    setError("");
    try {
      const res = await fetch(`/api/coach/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const available = ACTIONS.filter((a) => a.allowedFrom.includes(status));
  if (!available.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {available.map((a) => (
        <button
          key={a.to}
          type="button"
          onClick={() => change(a.to)}
          disabled={busy !== null}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === a.to ? "Saving…" : a.label}
        </button>
      ))}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
