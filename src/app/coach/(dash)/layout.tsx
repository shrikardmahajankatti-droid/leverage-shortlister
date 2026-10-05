import Link from "next/link";
import { requireCoachPage } from "@/lib/auth/require";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  await requireCoachPage();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/coach" className="text-base font-semibold text-slate-900">
            <span className="text-blue-800">Leverage Edu</span> · Coach dashboard
          </Link>
          <form action="/api/coach/logout" method="post">
            <button type="submit" className="min-h-11 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Log out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </div>
  );
}
