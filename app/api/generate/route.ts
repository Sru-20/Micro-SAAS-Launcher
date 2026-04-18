import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, dirname } from "path";
import { buildFileManifest, inferTemplate, type BlueprintInput } from "@/lib/code-generator";
import { autoDeployGeneratedApp } from "@/lib/auto-deploy";
import { jsonResponse } from "@/lib/api-json-response";

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

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      blueprint: BlueprintInput;
      projectId?: string;
      deploy?: boolean;
    };
    const { blueprint, projectId, deploy } = body;

    if (!blueprint?.project_name) {
      return jsonResponse(
        { error: "Invalid blueprint: missing project_name" },
        { status: 400 }
      );
    }

    const pid = projectId ?? blueprint.project_id ?? "generated_project";
    const templateName = inferTemplate(blueprint);

    const templateDir = join(process.cwd(), "templates", templateName);
    const templateFiles = readTemplateFiles(templateDir);

    const manifest = buildFileManifest(
      blueprint,
      pid,
      templateFiles,
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );

    const fileTree = manifest.map((f) => ({
      path: f.path,
      size: f.content.length,
      dir: dirname(f.path) === "." ? "(root)" : dirname(f.path),
    }));

    const shouldDeploy = deploy === true;
    const deployResult = shouldDeploy
      ? await autoDeployGeneratedApp({
          appName: blueprint.project_name,
          projectId: pid,
          files: manifest,
        })
      : null;

    return jsonResponse({
      ok: true,
      appName: blueprint.project_name,
      projectId: pid,
      fileCount: manifest.length,
      files: manifest,
      fileTree,
      deployRequested: shouldDeploy,
      deployment:
        deployResult && deployResult.ok
          ? {
              ok: true,
              pushed: deployResult.pushed,
              branch: deployResult.branch,
              liveUrl: deployResult.liveUrl,
              commitMessage: deployResult.commitMessage,
            }
          : deployResult
            ? { ok: false, error: deployResult.error }
            : null,
    });
  } catch (err) {
    console.error("[/api/generate] Error:", err);
    return jsonResponse(
      { error: "Generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
