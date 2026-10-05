import type { Metadata } from "next";
import ApplyForm from "./ApplyForm";

export const metadata: Metadata = { title: "Apply – Leverage Edu University Shortlist" };

export default function ApplyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-xl bg-white px-4 pt-6 pb-0 sm:my-6 sm:rounded-2xl sm:shadow-sm">
      <header className="mb-6">
        <p className="text-sm font-semibold tracking-wide text-blue-800 uppercase">Leverage Edu</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Your university shortlist</h1>
        <p className="mt-2 text-base text-slate-700">
          Six short steps, about 10 minutes. Your progress is saved on this device.
        </p>
      </header>
      <ApplyForm />
    </main>
  );
}
