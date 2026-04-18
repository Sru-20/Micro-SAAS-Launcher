import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BlueprintSchema } from "@/lib/blueprint-schema";
import { AutoCRUD } from "@/components/AutoCRUD";
import { SchemaCreateButton } from "@/components/SchemaCreateButton";
import { GenerateButton } from "@/components/GenerateButton";

export default async function BuilderProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, project_name, blueprint, created_at")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !project) {
    notFound();
  }

  const blueprint = BlueprintSchema.parse(project.blueprint);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <div className="text-xs text-slate-400">Project</div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {project.project_name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <SchemaCreateButton projectId={project.id} />
          <GenerateButton
            projectId={project.id}
            projectName={project.project_name}
            blueprint={blueprint}
          />
        </div>
      </header>

      <section className="space-y-4">
        {blueprint.tables.map((table) => (
          <AutoCRUD
            key={table.name}
            tableName={table.name}
            projectId={project.id}
            fields={table.fields}
          />
        ))}
      </section>
    </main>
  );
}

