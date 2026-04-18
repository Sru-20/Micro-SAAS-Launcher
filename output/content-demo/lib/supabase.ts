import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const safeUrl = supabaseUrl || "https://example.supabase.co";
const safeKey = supabaseKey || "public-anon-key";

export const supabase = createClient(safeUrl, safeKey);

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseKey);
}

