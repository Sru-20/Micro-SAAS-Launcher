import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateBlueprintFromIdea } from "@/lib/grok";
import { buildFileManifest, inferTemplate, type BlueprintInput } from "@/lib/code-generator";
import { autoDeployGeneratedApp } from "@/lib/auto-deploy";
import { join, relative } from "path";
import { readdirSync, readFileSync, statSync } from "fs";

function readTemplateFiles(dir: string, base = dir): Array<{ path: string; content: string }> {
  const result: Array<{ path: string; content: string }> = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        result.push(...readTemplateFiles(full, base));
      } else {
        try {
          result.push({
            path: relative(base, full).replace(/\\/g, "/"),
            content: readFileSync(full, "utf-8"),
          });
        } catch {
          // skip binary files
        }
      }
    }
  } catch {
    // dir missing
  }
  return result;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { idea?: string; deploy?: boolean }
    | null;

  if (!body?.idea || !body.idea.trim()) {
    return NextResponse.json(
      { error: "Idea is required" },
      { status: 400 },
    );
  }

  let blueprint: BlueprintInput;

  try {
    blueprint = await generateBlueprintFromIdea(body.idea);
    blueprint = {
      ...blueprint,
      template: inferTemplate(blueprint),
      modules: Array.from(new Set([...(blueprint.modules ?? []), "auth"])),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate blueprint";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      project_name: blueprint.project_name,
      description: blueprint.description,
      blueprint,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        error: "Failed to save blueprint",
        details: process.env.NODE_ENV === "development" ? insertError.message : undefined,
      },
      { status: 500 },
    );
  }

  let deployment:
    | { ok: true; pushed: boolean; branch: string; liveUrl: string; commitMessage: string }
    | { ok: false; error: string }
    | null = null;

  if (body.deploy === true) {
    const templateName = inferTemplate(blueprint);
    const templateDir = join(process.cwd(), "templates", templateName);
    const templateFiles = readTemplateFiles(templateDir);

    const manifest = buildFileManifest(
      blueprint,
      project.id,
      templateFiles,
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );

    const deployResult = await autoDeployGeneratedApp({
      appName: blueprint.project_name,
      projectId: project.id,
      files: manifest,
    });

    deployment = deployResult.ok
      ? {
          ok: true,
          pushed: deployResult.pushed,
          branch: deployResult.branch,
          liveUrl: deployResult.liveUrl,
          commitMessage: deployResult.commitMessage,
        }
      : { ok: false, error: deployResult.error };
  }

  return NextResponse.json({ project, blueprint, deployment });
}

