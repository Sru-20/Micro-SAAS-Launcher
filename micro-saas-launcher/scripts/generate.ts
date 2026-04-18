/**
 * scripts/generate.ts
 *
 * Micro-SaaS Launcher — Blueprint → Next.js App Generator (CLI)
 *
 * Usage:
 *   npx tsx scripts/generate.ts --blueprint ./my-blueprint.json --output ./output/my-app
 *   npx tsx scripts/generate.ts --blueprint ./my-blueprint.json --output ./output/my-app --project-id proj_123
 *
 * What it does:
 *  1. Reads the blueprint JSON
 *  2. Reads all template files from templates/full-app/
 *  3. Calls buildFileManifest() from lib/code-generator to produce the full file list
 *  4. Writes every file to the output directory
 *  5. Prints a manifest of all generated files
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, resolve, relative, dirname } from "path";
import {
  buildFileManifest,
  inferTemplate,
  type BlueprintInput,
  type GeneratedFile,
} from "../lib/code-generator";

// ─── CLI Argument Parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const blueprintPath = getArg("--blueprint");
const outputPath = getArg("--output");
const projectIdArg = getArg("--project-id");

if (!blueprintPath || !outputPath) {
  console.error(`
Usage: npx tsx scripts/generate.ts --blueprint <path> --output <path> [--project-id <id>]

Example:
  npx tsx scripts/generate.ts \\
    --blueprint ./test-blueprint.json \\
    --output ./output/feedback-app \\
    --project-id proj_feedback_001
`);
  process.exit(1);
}

// ─── File Tree Utilities ───────────────────────────────────────────────────────

function listFilesRecursive(dir: string, base = dir): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listFilesRecursive(full, base));
    } else {
      files.push(relative(base, full).replace(/\\/g, "/"));
    }
  }
  return files;
}

function readTemplateFiles(templateDir: string): GeneratedFile[] {
  const result: GeneratedFile[] = [];
  const allPaths = listFilesRecursive(templateDir);
  for (const relPath of allPaths) {
    try {
      const content = readFileSync(join(templateDir, relPath), "utf-8");
      result.push({ path: relPath, content });
    } catch {
      // skip binary files
    }
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const ROOT = resolve(__dirname, "..");
  const BLUEPRINT_FILE = resolve(blueprintPath!);
  const OUTPUT_DIR = resolve(outputPath!);

  console.log("\n🚀 Micro-SaaS Launcher — Code Generator\n");

  // 1. Read blueprint JSON
  console.log(`📄 Reading blueprint: ${BLUEPRINT_FILE}`);
  let blueprint: BlueprintInput;
  try {
    const raw = readFileSync(BLUEPRINT_FILE, "utf-8");
    blueprint = JSON.parse(raw);
  } catch (err) {
    console.error(`❌ Failed to read/parse blueprint: ${err}`);
    process.exit(1);
  }

  const projectId = projectIdArg ?? blueprint.project_id ?? "PLACEHOLDER_PROJECT_ID";
  const appName = blueprint.project_name;
  const templateName = inferTemplate(blueprint);
  const TEMPLATE_DIR = join(ROOT, "templates", templateName);

  console.log(`✅ Blueprint: "${appName}" (project_id: ${projectId})`);
  console.log(`📦 Pages: ${(blueprint.pages ?? []).length} | Tables: ${(blueprint.tables ?? []).length}`);

  // 2. Read template files
  console.log(`\n📁 Reading template files from: ${TEMPLATE_DIR}`);
  const templateFiles = readTemplateFiles(TEMPLATE_DIR);

  if (templateFiles.length === 0) {
    console.error(`❌ No template files found in ${TEMPLATE_DIR}. Check blueprint.template ("${templateName}").`);
    process.exit(1);
  }

  // 3. Build the full manifest using shared lib/code-generator logic
  console.log("\n⚙️  Building file manifest...");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const manifest = buildFileManifest(blueprint, projectId, templateFiles, supabaseUrl, supabaseKey);

  // 4. Write all files to output directory
  console.log(`\n📝 Writing ${manifest.length} files to: ${OUTPUT_DIR}`);
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const file of manifest) {
    const fullPath = join(OUTPUT_DIR, file.path);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, file.content, "utf-8");
  }

  // 5. Print manifest grouped by directory
  const groups = new Map<string, string[]>();
  for (const f of manifest) {
    const dir = dirname(f.path) === "." ? "(root)" : dirname(f.path);
    const group = groups.get(dir) ?? [];
    group.push(f.path);
    groups.set(dir, group);
  }

  console.log(`\n📋 Generated ${manifest.length} files:\n`);
  for (const [dir, groupFiles] of Array.from(groups.entries())) {
    console.log(`  📂 ${dir}`);
    for (const f of groupFiles) {
      console.log(`     └─ ${f}`);
    }
  }

  console.log(`
✅ Generation complete!

Next steps:
  cd ${OUTPUT_DIR}
  npm install
  npm run dev

Then open http://localhost:3000
`);
}

main().catch((err) => {
  console.error("❌ Generator error:", err);
  process.exit(1);
});
