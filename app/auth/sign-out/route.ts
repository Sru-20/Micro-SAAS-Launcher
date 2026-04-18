import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  const redirectUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return NextResponse.redirect(new URL("/login", redirectUrl), {
    status: 302,
  });
}

