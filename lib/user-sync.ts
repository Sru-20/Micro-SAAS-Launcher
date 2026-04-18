import type { SupabaseClient, User } from "@supabase/supabase-js";

function userDisplayName(user: User): string | null {
  const metadata = user.user_metadata ?? {};
  const candidates = [
    metadata.full_name,
    metadata.name,
    metadata.user_name,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export async function syncUserToUsersTable(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; message: string }> {
  const payload = {
    id: user.id,
    email: user.email ?? null,
    full_name: userDisplayName(user),
    avatar_url:
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : null,
  };

  const { error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

