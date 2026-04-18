import JSZip from "jszip";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { buildFileManifest, inferTemplate, type BlueprintInput } from "@/lib/code-generator";
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
          const content = readFileSync(full, "utf-8");
          result.push({ path: relative(base, full).replace(/\\/g, "/"), content });
        } catch {
          // skip binary files silently
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
    };
    const { blueprint, projectId } = body;

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

    if (templateFiles.length === 0) {
      return jsonResponse(
        {
          error: "Template files not found.",
          details: `Ensure templates/${templateName}/ exists.`,
        },
        { status: 500 }
      );
    }

    const manifest = buildFileManifest(
      blueprint,
      pid,
      templateFiles,
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    );

    const zip = new JSZip();
    for (const file of manifest) {
      zip.file(file.path, file.content);
    }

    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const slug = blueprint.project_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${slug}-app.zip"`,
        "Content-Length": String(zipBuffer.byteLength),
      },
    });
  } catch (err) {
    console.error("[/api/generate/download] Error:", err);
    return jsonResponse(
      { error: "ZIP generation failed", details: String(err) },
      { status: 500 }
    );
  }
}
