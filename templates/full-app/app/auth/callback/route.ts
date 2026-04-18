import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { syncUserToUsersTable } from "@/lib/user-sync";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(login);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const syncResult = await syncUserToUsersTable(supabase, user);
    if (!syncResult.ok) {
      const login = new URL("/login", origin);
      login.searchParams.set("error", "user_sync_failed");
      login.searchParams.set("details", encodeURIComponent(syncResult.message));
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
