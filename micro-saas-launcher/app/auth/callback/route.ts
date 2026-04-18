import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { syncUserToUsersTable } from "@/lib/user-sync";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // If Supabase redirected back without a code, send user to login.
  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const syncResult = await syncUserToUsersTable(supabase, user);
    if (!syncResult.ok) {
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set("error", "user_sync_failed");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL("/dashboard", origin));
}

