import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Coach login – Leverage Edu" };

export default function CoachLoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm items-center px-4">
      <div className="w-full rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-blue-800 uppercase">Leverage Edu</p>
        <h1 className="mt-1 mb-5 text-xl font-bold text-slate-900">Coach dashboard</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
