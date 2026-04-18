/**
 * blueprint-config.ts
 *
 * Placeholder for local template development. The generator overwrites this file
 * with project-specific values when you run the launcher.
 */

export type FieldDef = {
  name: string;
  type: string;
};

export type SectionConfig = {
  type: "hero" | "form" | "table" | "cards" | string;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  table?: string;
  fields?: FieldDef[];
};

export type PageConfig = {
  name: string;
  type: "landing" | "form" | "dashboard" | "list" | "detail" | string;
  sections: SectionConfig[];
};

export const APP_NAME = "Micro SAAS";
export const PROJECT_ID = "PLACEHOLDER_PROJECT_ID";
export const TEMPLATE = "full-app";
export const MODULES: string[] = [];
/** Set true in generated apps when blueprint includes "auth" module */
export const ENABLE_AUTH = false;
export const TABLE_PREFIX = "micro_saas";

export function dbTableName(rawTableName: string): string {
  return `${TABLE_PREFIX}_${rawTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
}

export const navPages: Array<{ name: string; type: string }> = [
  { name: "Home", type: "landing" },
  { name: "Dashboard", type: "dashboard" },
];

export const pageConfigs: Record<string, PageConfig> = {
  example: {
    name: "Example",
    type: "form",
    sections: [
      {
        type: "form",
        table: "example",
        fields: [
          { name: "title", type: "text" },
          { name: "description", type: "text" },
        ],
      },
    ],
  },
};

export const dashboardTables: Array<{ table: string; fields: FieldDef[] }> = [
  {
    table: "example",
    fields: [
      { name: "title", type: "text" },
      { name: "description", type: "text" },
    ],
  },
];
