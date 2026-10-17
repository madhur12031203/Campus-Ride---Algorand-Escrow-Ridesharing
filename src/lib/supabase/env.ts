export function getSupabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    if (typeof window === "undefined") {
      // Return safe placeholder during static build/prerendering
      return "https://placeholder-project.supabase.co";
    }
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol !== "https:") {
      throw new Error("Supabase URL must start with https://");
    }
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is invalid. It should look like https://your-project-ref.supabase.co."
    );
  }

  return supabaseUrl;
}

export function getSupabasePublishableKey() {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseKey) {
    if (typeof window === "undefined") {
      // Return safe placeholder during static build/prerendering
      return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";
    }
    throw new Error(
      "Missing Supabase public key. Add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel environment variables."
    );
  }

  return supabaseKey;
}

export function getSupabaseServiceRoleKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    if (typeof window === "undefined") {
      return "placeholder-service-role-key";
    }
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return serviceRoleKey;
}
