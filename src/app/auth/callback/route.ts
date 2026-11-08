import { createServerClient } from "@supabase/ssr";
import { getAccountServiceFailure } from "@/lib/supabase/auth-errors";
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
  const selectedRole = requestUrl.searchParams.get("role");
  const role = selectedRole === "driver" || selectedRole === "passenger" ? selectedRole : null;

  const fail = (reason: "callback" | "connection" | "response" | "cancelled") => {
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

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.email ? user.email.split("@")[0] : "Campus Rider");

  // Upsert user profile with role (only update role if provided)
  const updateData: { id: string; name: string; role?: string } = {
    id: user.id,
    name,
  };

  if (role) {
    updateData.role = role;
  }

  await supabase.from("users").upsert(updateData, { onConflict: "id" });

  return redirectToPath("/dashboard");
}
