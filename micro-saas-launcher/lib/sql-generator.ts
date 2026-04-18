import type { Blueprint } from "./blueprint-schema";
import { sanitizeIdentifier } from "./identifiers";

const TYPE_MAP = {
  uuid: "UUID",
  text: "TEXT",
  integer: "INTEGER",
  boolean: "BOOLEAN",
  timestamp: "TIMESTAMP",
  // Extra aliases for safety / future use
  date: "TIMESTAMP",
  number: "NUMERIC",
} as const;

type BlueprintFieldType = keyof typeof TYPE_MAP;

function mapFieldType(input: string): string {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    throw new Error("Field type cannot be empty");
  }

  const mapped = TYPE_MAP[normalized as BlueprintFieldType];
  if (!mapped) {
    throw new Error(`Unsupported field type: ${input}`);
  }

  return mapped;
}

const SYSTEM_COLUMN_NAMES = new Set(["id", "project_id", "created_at", "updated_at"]);

export function generateCreateTableStatements(blueprint: Blueprint): string[] {
  if (!blueprint.tables || blueprint.tables.length === 0) {
    throw new Error("Blueprint has no tables to generate");
  }

  const prefix = sanitizeIdentifier(blueprint.project_name);

  return blueprint.tables.map((table) => {
    const tableName = `${prefix}_${sanitizeIdentifier(table.name)}`;

    const seenColumns = new Set<string>();
    const userColumns: string[] = [];

    for (const field of table.fields) {
      const columnName = sanitizeIdentifier(field.name);
      const key = columnName.toLowerCase();

      if (seenColumns.has(key)) {
        // Skip duplicate column definitions
        continue;
      }
      seenColumns.add(key);

      // Skip system columns; we always add our own canonical definitions
      if (SYSTEM_COLUMN_NAMES.has(key)) {
        continue;
      }

      const sqlType = mapFieldType(field.type);
      userColumns.push(`  ${columnName} ${sqlType}`);
    }

    const columns: string[] = [];

    // System columns for multi-tenant & auditing
    columns.push(
      `  id UUID PRIMARY KEY DEFAULT gen_random_uuid()`,
      `  project_id UUID NOT NULL`,
      `  created_at TIMESTAMP DEFAULT now()`,
      `  updated_at TIMESTAMP DEFAULT now()`,
    );

    columns.push(...userColumns);

    const columnDefs = columns.join(",\n");

    return `CREATE TABLE IF NOT EXISTS ${tableName} (\n${columnDefs}\n);`;
  });
}

