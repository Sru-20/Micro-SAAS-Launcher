import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";

export default async function DashboardHomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, project_name, created_at")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your Projects
          </h1>
          <p className="text-sm text-slate-300">
            Blueprints generated from your SaaS ideas.
          </p>
        </div>
        <Button asChild>
          <Link href="/builder">New blueprint</Link>
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-sm text-slate-400">
          You don&apos;t have any projects yet. Start by creating a new
          blueprint.
        </p>
      ) : (
        <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950 p-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-slate-900"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-100">
                  {project.project_name}
                </div>
                <div className="text-xs text-slate-400">
                  {project.created_at
                    ? new Date(project.created_at).toLocaleString()
                    : "Unknown date"}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/builder/${project.id}`}>Open app</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


