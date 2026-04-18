/**
 * lib/code-generator.ts
 *
 * Micro-SaaS Launcher — Shared Code Generation Logic
 *
 * Pure TypeScript module with no filesystem or HTTP side-effects.
 * Imported by:
 *   - scripts/generate.ts  (CLI)
 *   - app/api/generate/route.ts  (JSON manifest API)
 *   - app/api/generate/download/route.ts  (ZIP download API)
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FieldDef {
  name: string;
  type: string;
}

export interface BlueprintSection {
  type: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  table?: string;
  fields?: string[] | FieldDef[];
  tables?: string[];
}

export interface BlueprintPage {
  name: string;
  type: string;
  table?: string;
  tables?: string[];
  sections?: BlueprintSection[];
}

export interface BlueprintTable {
  name: string;
  fields: FieldDef[];
}

export interface BlueprintInput {
  project_name: string;
  description?: string;
  tables?: BlueprintTable[];
  pages?: (BlueprintPage | string)[];
  project_id?: string;
  /** Optional template identifier, e.g. "full-app" | "marketplace" | "content-site" */
  template?: string;
  /** Optional modules list, e.g. ["auth"] */
  modules?: string[];
}

export interface GeneratedFile {
  /** Relative path inside the app root, e.g. "lib/blueprint-config.ts" */
  path: string;
  /** Full UTF-8 text content */
  content: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SYSTEM_FIELDS = new Set(["id", "project_id", "created_at", "updated_at"]);

// ─── Helpers ───────────────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export function inferTemplate(blueprint: BlueprintInput): string {
  if (blueprint.template) return blueprint.template;

  const project = blueprint.project_name.toLowerCase();
  const tableNames = (blueprint.tables ?? []).map((t) => t.name.toLowerCase());
  const pageNames = (blueprint.pages ?? [])
    .filter((p): p is BlueprintPage => typeof p === "object")
    .map((p) => `${p.name} ${p.type}`.toLowerCase());

  const haystack = [project, ...tableNames, ...pageNames].join(" ");
  const isContent = /(blog|post|article|news|content|author|category)/.test(haystack);
  const isMarketplace = /(market|listing|seller|vendor|service|product|catalog)/.test(haystack);

  if (isContent) return "content-site";
  if (isMarketplace) return "marketplace";
  return "content-site";
}

function sanitizeDbIdentifier(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  const cleaned = normalized.replace(/[^a-z0-9_]/g, "_");
  if (!cleaned) throw new Error(`Invalid identifier: "${raw}"`);
  if (!/^[a-z_]/.test(cleaned)) {
    throw new Error(`Identifier must start with a letter or underscore: "${raw}"`);
  }
  return cleaned;
}

export function getTableFields(blueprint: BlueprintInput, tableName: string): FieldDef[] {
  const table = blueprint.tables?.find((t) => t.name === tableName);
  return (table?.fields ?? []).filter((f) => !SYSTEM_FIELDS.has(f.name));
}

export function normalizeSectionFields(
  blueprint: BlueprintInput,
  section: BlueprintSection
): FieldDef[] {
  if (Array.isArray(section.fields) && section.fields.length > 0) {
    const first = section.fields[0];
    if (typeof first === "object" && "type" in first) {
      return (section.fields as FieldDef[]).filter((f) => !SYSTEM_FIELDS.has(f.name));
    }
    // Array of field-name strings → look up types from the table definition
    if (section.table) {
      const all = getTableFields(blueprint, section.table);
      const names = section.fields as string[];
      return all.filter((f) => names.includes(f.name));
    }
    return (section.fields as string[]).map((name) => ({ name, type: "text" }));
  }
  if (section.table) return getTableFields(blueprint, section.table);
  return [];
}

// ─── Blueprint Config Generator ────────────────────────────────────────────────

/**
 * Generates the full text content of `lib/blueprint-config.ts`
 * from a blueprint JSON and a project ID.
 */
export function generateBlueprintConfig(blueprint: BlueprintInput, projectId: string): string {
  const appName = blueprint.project_name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const modules = Array.isArray(blueprint.modules) ? blueprint.modules : [];
  const template = inferTemplate(blueprint);
  const enableAuth = modules.includes("auth");
  const tablePrefix = sanitizeDbIdentifier(blueprint.project_name);

  const pages = (blueprint.pages ?? []).filter(
    (p): p is BlueprintPage => typeof p === "object"
  );

  // Nav pages — all pages for navigation
  const navPagesArr = pages.map((p) => ({ name: p.name, type: p.type }));

  // Page configs — non-landing pages keyed by slug
  const pageConfigsObj: Record<string, unknown> = {};
  const nonLanding = pages.filter((p) => p.type !== "landing");
  for (const page of nonLanding) {
    const slug = slugify(page.name);
    pageConfigsObj[slug] = {
      name: page.name,
      type: page.type,
      sections: (page.sections ?? []).map((s) => ({
        type: s.type,
        ...(s.title ? { title: s.title } : {}),
        ...(s.subtitle ? { subtitle: s.subtitle } : {}),
        ...(s.cta_text ? { cta_text: s.cta_text } : {}),
        ...(s.cta_link ? { cta_link: s.cta_link } : {}),
        ...(s.table ? { table: s.table } : {}),
        fields: normalizeSectionFields(blueprint, s),
      })),
    };
  }

  // Dashboard tables — from pages with type "dashboard" or "list"
  const dashboardTables: Array<{ table: string; fields: FieldDef[] }> = [];
  for (const page of pages) {
    if (!["dashboard", "list"].includes(page.type)) continue;
    for (const section of page.sections ?? []) {
      if (!["table", "cards"].includes(section.type) || !section.table) continue;
      if (!dashboardTables.find((d) => d.table === section.table)) {
        dashboardTables.push({
          table: section.table,
          fields: normalizeSectionFields(blueprint, section),
        });
      }
    }
    for (const tName of page.tables ?? []) {
      if (!dashboardTables.find((d) => d.table === tName)) {
        dashboardTables.push({ table: tName, fields: getTableFields(blueprint, tName) });
      }
    }
  }

  return `/**
 * blueprint-config.ts
 *
 * AUTO-GENERATED by Micro-SaaS Launcher.
 * Do not edit manually — re-run the generator to update.
 *
 * Blueprint : ${blueprint.project_name}
 * Generated : ${new Date().toISOString()}
 * Project ID: ${projectId}
 */

export type FieldDef = { name: string; type: string };

export type SectionConfig = {
  type: string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  table?: string;
  fields?: FieldDef[];
};

export type PageConfig = {
  name: string;
  type: string;
  sections: SectionConfig[];
};

export const APP_NAME = ${JSON.stringify(appName)};
export const PROJECT_ID = ${JSON.stringify(projectId)};
export const TEMPLATE = ${JSON.stringify(template)};
export const MODULES: string[] = ${JSON.stringify(modules, null, 2)};
export const ENABLE_AUTH = ${JSON.stringify(enableAuth)};
export const TABLE_PREFIX = ${JSON.stringify(tablePrefix)};

export function dbTableName(rawTableName: string): string {
  return \`\${TABLE_PREFIX}_\${rawTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")}\`;
}

export const navPages: Array<{ name: string; type: string }> = ${JSON.stringify(navPagesArr, null, 2)};

export const pageConfigs: Record<string, PageConfig> = ${JSON.stringify(pageConfigsObj, null, 2)};

export const dashboardTables: Array<{ table: string; fields: FieldDef[] }> = ${JSON.stringify(dashboardTables, null, 2)};
`;
}

// ─── File Manifest Builder ─────────────────────────────────────────────────────

/**
 * Path prefixes / exact names that should never appear in a generated ZIP.
 * These are build artifacts, lockfiles, or secrets that belong to the
 * launcher's own dev environment — not the generated app.
 */
const EXCLUDED_PATHS = new Set([
  "package-lock.json",
  "tsconfig.tsbuildinfo",
  ".env.local",   // replaced below with a generated version
]);

function isExcluded(filePath: string): boolean {
  // Normalise to forward slashes
  const p = filePath.replace(/\\/g, "/");
  // Exclude whole directories
  if (p.startsWith(".next/") || p.startsWith("node_modules/")) return true;
  return EXCLUDED_PATHS.has(p);
}

/**
 * Merges a list of template files with the generated blueprint-config.ts
 * and a generated .env.local. Returns the full file manifest for the app.
 *
 * @param blueprint   The parsed blueprint JSON
 * @param projectId   The project's Supabase ID
 * @param templateFiles  All files read from templates/full-app/ as { path, content }
 * @param supabaseUrl    Optional — written into .env.local
 * @param supabaseKey    Optional — written into .env.local
 */
export function buildFileManifest(
  blueprint: BlueprintInput,
  projectId: string,
  templateFiles: GeneratedFile[],
  supabaseUrl = "",
  supabaseKey = ""
): GeneratedFile[] {
  const configContent = generateBlueprintConfig(blueprint, projectId);

  const manifest: GeneratedFile[] = [];

  for (const file of templateFiles) {
    // Skip build artifacts, lockfiles, secrets
    if (isExcluded(file.path)) continue;

    // Rename next.config.js → next.config.mjs (we ship the ESM version)
    if (file.path === "next.config.js") continue;

    // Fill blueprint-config.ts with generated content
    if (file.path === "lib/blueprint-config.ts") {
      manifest.push({ path: file.path, content: configContent });
      continue;
    }

    // Replace .env.example with a pre-filled .env.local
    if (file.path === ".env.example") {
      manifest.push({
        path: ".env.local",
        content: [
          "# Auto-generated by Micro-SaaS Launcher",
          `# Blueprint: ${blueprint.project_name}`,
          `# Project ID: ${projectId}`,
          "",
          `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`,
          `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}`,
          "",
        ].join("\n"),
      });
      continue;
    }

    manifest.push(file);
  }

  return manifest;
}
