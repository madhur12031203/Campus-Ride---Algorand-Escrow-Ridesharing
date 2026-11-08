import { createServerClient } from "@supabase/ssr";
import { getAccountServiceFailure } from "@/lib/supabase/auth-errors";
import { ensureAccountProfile } from "@/lib/supabase/account-profile";
import { parseRideRole, rideDeskPath } from "@/lib/ride-roles";
import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function redirectToPath(path: string) {
  return new NextResponse(null, {
    status: 307,
    headers: { Location: path, "Cache-Control": "no-store" },
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const role = parseRideRole(requestUrl.searchParams.get("role"));

  const fail = (reason: "callback" | "connection" | "response" | "cancelled" | "profile") => {
    const login = role === "driver" ? "/login/driver" : "/login/passenger";
    return redirectToPath(login + "?" + new URLSearchParams({ error: reason }));
  };

  if (!isSupabaseConfigured()) return fail("connection");
  const providerError = requestUrl.searchParams.get("error");
  if (providerError) return fail(providerError === "access_denied" ? "cancelled" : "callback");
  const cookieStore = await cookies();
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
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
            // Ignore when called from a context that cannot set cookies
          }
        },
      },
    }
  );

  if (code) {
    // Handle OAuth callback
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail(getAccountServiceFailure(error) ?? "callback");
    if (requestUrl.searchParams.get("mode") === "recovery") {
      return redirectToPath("/auth/reset-password");
    }
  }

  // Get current user (works for both OAuth and email/password)
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!user) return fail(getAccountServiceFailure(userError) ?? "callback");

  try {
    const profile = await ensureAccountProfile(user, role);
    return redirectToPath(profile.role ? rideDeskPath(profile.role) : "/dashboard");
  } catch {
    return fail("profile");
  }
}
