/**
 * Placeholder file.
 *
 * This file will be overwritten by the generator with the
 * project-specific `APP_NAME`, `PROJECT_ID`, `ENABLE_AUTH`, etc.
 */

export const APP_NAME = "Marketplace";
export const PROJECT_ID = "PLACEHOLDER_PROJECT_ID";
export const ENABLE_AUTH = false;
export const TABLE_PREFIX = "placeholder_project";

export function dbTableName(rawTableName: string): string {
  return `${TABLE_PREFIX}_${rawTableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
}

