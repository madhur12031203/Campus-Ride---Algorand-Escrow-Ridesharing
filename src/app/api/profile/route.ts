import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseRideRole } from "@/lib/ride-roles";
import {
  ACCOUNT_PROFILE_COLUMNS,
  createAccountAdminClient,
  ensureAccountProfile,
} from "@/lib/supabase/account-profile";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

type ProfileBody = {
  role?: string | null;
  walletAddress?: string | null;
};

async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Route handlers can set cookies; keep this defensive for shared runtime behavior.
        }
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function GET() {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await ensureAccountProfile(user);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Could not load your account profile." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getAuthUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ProfileBody;
  const updates: { role?: string; wallet_address?: string | null } = {};

  if (body.role !== undefined) {
    const role = parseRideRole(body.role);
    if (!role) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
    updates.role = role;
  }

  if (body.walletAddress !== undefined) {
    updates.wallet_address = body.walletAddress?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No profile updates provided." }, { status: 400 });
  }

  try {
    const update = createAccountAdminClient().from("users").update(updates).eq("id", user.id);
    if (updates.role) update.is("role", null);
    const { data, error } = await update.select(ACCOUNT_PROFILE_COLUMNS).maybeSingle();
    if (error) throw error;
    if (!data) {
      return updates.role
        ? NextResponse.json({ error: "Your account role is already set." }, { status: 409 })
        : NextResponse.json({ error: "Account profile not found." }, { status: 404 });
    }
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Could not update your account profile." }, { status: 500 });
  }
}
