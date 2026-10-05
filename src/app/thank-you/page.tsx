import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thank you – Leverage Edu" };

export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl items-center px-4">
      <div className="w-full rounded-2xl bg-white p-8 text-center shadow-sm">
        <div aria-hidden="true" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl text-green-800">
          ✓
        </div>
        <h1 className="text-xl font-semibold text-slate-900">
          Thank you for your response. The team will get back to you shortly.
        </h1>
      </div>
    </main>
  );
}
