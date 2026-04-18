export function sanitizeIdentifier(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  const cleaned = normalized.replace(/[^a-z0-9_]/g, "_");

  if (!cleaned) {
    throw new Error(`Invalid identifier: "${raw}"`);
  }

  if (!/^[a-z_]/.test(cleaned)) {
    throw new Error(
      `Identifier must start with a letter or underscore: "${raw}"`,
    );
  }

  return cleaned;
}

