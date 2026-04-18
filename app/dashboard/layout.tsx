import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-800 bg-slate-900/80 px-4 py-6">
        <div className="mb-8">
          <Link href="/dashboard" className="text-lg font-semibold">
            Micro-SaaS Launcher
          </Link>
        </div>
        <nav className="flex-1 space-y-2 text-sm">
          <Link
            href="/dashboard"
            className="block rounded px-2 py-1 hover:bg-slate-800"
          >
            Overview
          </Link>
          <Link
            href="/builder"
            className="block rounded px-2 py-1 hover:bg-slate-800"
          >
            Blueprint Builder
          </Link>
        </nav>
        <form
          action="/auth/sign-out"
          method="post"
          className="pt-6"
        >
          <Button
            type="submit"
            variant="outline"
            className="w-full border-slate-700 text-slate-200"
          >
            Sign out
          </Button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

