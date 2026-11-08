import { createClient, type User } from "@supabase/supabase-js";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";
import type { UserProfileRow, UserRole } from "@/types";

export const ACCOUNT_PROFILE_COLUMNS = "id,name,role,wallet_address,rating_avg,rating_count";

export function createAccountAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function ensureAccountProfile(user: User, initialRole: UserRole | null = null) {
  const supabase = createAccountAdminClient();
  const name = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name.trim()
    : "";
  const { error: insertError } = await supabase.from("users").upsert(
    { id: user.id, name: name || user.email?.split("@")[0] || "Rider", role: initialRole },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (insertError) throw insertError;

  if (initialRole) {
    // Competing sign-ins can only assign a role once. Never overwrite a saved role.
    const { error } = await supabase.from("users")
      .update({ role: initialRole })
      .eq("id", user.id)
      .is("role", null);
    if (error) throw error;
  }

  const { data, error } = await supabase.from("users")
    .select(ACCOUNT_PROFILE_COLUMNS)
    .eq("id", user.id)
    .single();
  if (error) throw error;
  return data as UserProfileRow;
}
