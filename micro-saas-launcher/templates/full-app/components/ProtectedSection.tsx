"use client";

import { ENABLE_AUTH } from "@/lib/blueprint-config";
import { RequireAuth } from "@/lib/auth";

/**
 * Wraps UI that reads/writes Supabase. When auth is enabled in the blueprint,
 * the user must sign in (Google) so RLS sees auth.uid().
 */
export function ProtectedSection({ children }: { children: React.ReactNode }) {
  if (!ENABLE_AUTH) {
    return <>{children}</>;
  }
  return <RequireAuth>{children}</RequireAuth>;
}
