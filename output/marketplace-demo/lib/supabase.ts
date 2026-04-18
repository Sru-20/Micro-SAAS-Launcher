import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Template-friendly behavior:
 * - Never throw at module-import time (Next build/prerender would fail).
 * - If env vars are missing, we create a harmless placeholder client.
 *   The UI will still render, and runtime calls will surface errors.
 */
const safeUrl = supabaseUrl || "https://example.supabase.co";
const safeKey = supabaseKey || "public-anon-key";

export const supabase = createClient(safeUrl, safeKey);

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseKey);
}

