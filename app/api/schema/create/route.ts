import { createServerSupabaseClient } from "@/lib/supabase-server";
import { BlueprintSchema } from "@/lib/blueprint-schema";
import { generateCreateTableStatements } from "@/lib/sql-generator";
import { generateRlsStatements } from "@/lib/rls-generator";
import { jsonResponse } from "@/lib/api-json-response";

export async function POST(request: Request): Promise<Response> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { project_id?: string }
    | null;

  if (!body?.project_id) {
    return jsonResponse({ error: "project_id is required" }, { status: 400 });
  }

  const projectId = body.project_id;

  const {
    data: project,
    error: projectError,
  } = await supabase
    .from("projects")
    .select("id, user_id, blueprint")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return jsonResponse(
      { error: "Project not found", details: projectError?.message },
      { status: 404 },
    );
  }

  if (project.user_id !== user.id) {
    return jsonResponse({ error: "Forbidden" }, { status: 403 });
  }

  let blueprint;
  try {
    blueprint = BlueprintSchema.parse(project.blueprint);
  } catch {
    return jsonResponse(
      { error: "Stored blueprint is invalid" },
      { status: 500 },
    );
  }

  let statements: string[];
  try {
    statements = generateCreateTableStatements(blueprint);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate SQL";
    return jsonResponse({ error: message }, { status: 400 });
  }

  for (const statement of statements) {
    const { error } = await supabase.rpc("run_sql", { query: statement });
    if (error) {
      return jsonResponse(
        {
          error: "Failed to execute schema SQL",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 },
      );
    }
  }

  const rlsStatements = generateRlsStatements(blueprint);
  for (const statement of rlsStatements) {
    const { error } = await supabase.rpc("run_sql", { query: statement });
    if (error) {
      return jsonResponse(
        {
          error: "Failed to apply RLS policies",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 },
      );
    }
  }

  return jsonResponse({
    status: "schema_created",
    project_id: projectId,
    rls_applied: true,
    sql:
      process.env.NODE_ENV === "development"
        ? statements
        : undefined,
    rls_sql:
      process.env.NODE_ENV === "development"
        ? rlsStatements
        : undefined,
  });
}
