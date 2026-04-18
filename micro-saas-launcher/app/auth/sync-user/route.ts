import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { syncUserToUsersTable } from "@/lib/user-sync";

export async function POST() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncUserToUsersTable(supabase, user);
  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Failed to sync user profile",
        details:
          process.env.NODE_ENV === "development" ? result.message : undefined,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, user_id: user.id });
}

