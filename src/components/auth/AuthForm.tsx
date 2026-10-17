"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createDemoSession, getDemoUser } from "@/lib/auth/demoAuth";
import { useRouter } from "next/navigation";

type AuthFormProps = {
  role: "driver" | "passenger";
  title: string;
  subtitle: string;
  accentClass: string;
};

async function readJsonResponse(response: Response): Promise<{ error?: string }> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as { error?: string };
  } catch {
    return {
      error: response.ok
        ? "Received an invalid response from the server."
        : text.slice(0, 200) || "Unable to create account.",
    };
  }
}

export default function AuthForm({ role, title, subtitle, accentClass }: AuthFormProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const demoUser = getDemoUser();
    if (demoUser) {
      router.replace("/");
      return;
    }
    setIsConfigured(isSupabaseConfigured());
  }, [router]);

  function getErrorMessage(err: unknown, fallback: string): string {
    if (!(err instanceof Error)) return fallback;

    const lower = err.message.toLowerCase();
    if (lower.includes("invalid login credentials")) {
      return "Invalid email or password. If you haven't created an account yet, switch to 'Sign Up' above.";
    }

    if (lower.includes("failed to fetch") || lower.includes("placeholder")) {
      return "Could not reach Supabase backend. Use 'Instant Demo Login' below or configure .env.local.";
    }

    return err.message;
  }

  function getAuthBaseUrl(): string {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured) return configured.replace(/\/$/, "");
    return window.location.origin;
  }

  function handleInstantDemo() {
    createDemoSession(role, email || undefined, name || undefined);
    window.location.href = "/";
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        // Fallback to instant local demo session if Supabase is not configured
        createDemoSession(role, email, isSignUp ? name : undefined);
        window.location.href = "/";
        return;
      }

      const supabase = createClient();
      const baseUrl = getAuthBaseUrl();
      const redirectTo = `${baseUrl}/auth/callback?role=${role}`;

      if (isSignUp) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name,
            role,
          }),
        });

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(result.error || "Unable to create account.");
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        window.location.href = redirectTo;
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        window.location.href = redirectTo;
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Authentication failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError(null);

    if (!isSupabaseConfigured()) {
      handleInstantDemo();
      return;
    }

    try {
      const supabase = createClient();
      const baseUrl = getAuthBaseUrl();
      const redirectTo = `${baseUrl}/auth/callback?role=${role}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Google sign-in failed. Please try again."));
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/80 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
      <div className={`mb-4 h-1.5 w-14 rounded-full ${accentClass}`} />
      <h2 className="text-xl font-semibold text-slate-100 sm:text-2xl">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>

      {/* Toggle between Sign Up and Sign In */}
      <div className="mt-6 flex gap-2 rounded-lg border border-white/10 bg-slate-900/70 p-1">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            !isSignUp
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError(null);
          }}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            isSignUp
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-300/50"
              required={isSignUp}
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-300/50"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-xs font-medium text-slate-300">
              Password
            </label>
            {!isSignUp && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError("Please enter your email first");
                    return;
                  }
                  try {
                    const supabase = createClient();
                    const baseUrl = getAuthBaseUrl();
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${baseUrl}/auth/reset-password`,
                    });
                    if (error) throw error;
                    setError(null);
                    alert("Password reset email sent! Check your inbox.");
                  } catch (err: unknown) {
                    setError(getErrorMessage(err, "Failed to send reset email"));
                  }
                }}
                className="text-xs text-blue-400 transition hover:text-blue-300"
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? "Create a password (min. 6 characters)" : "Enter your password"}
            className="w-full rounded-lg border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-300/50"
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-teal-400 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-teal-950/30 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading
            ? "Processing..."
            : isSignUp
              ? "Create Account"
              : "Sign In"}
        </button>
      </form>

      {/* Quick Demo Access Button */}
      <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-center">
        <p className="text-[11px] text-slate-300 font-mono mb-2">
          Want to test immediately without typing passwords?
        </p>
        <button
          type="button"
          onClick={handleInstantDemo}
          className="w-full rounded-lg border border-emerald-500/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          ⚡ Instant 1-Click Demo Login ({role === "driver" ? "Campus Driver" : "Campus Passenger"})
        </button>
      </div>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-700" />
        <span className="text-xs text-slate-500">OR CONTINUE WITH GOOGLE</span>
        <div className="h-px flex-1 bg-slate-700" />
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleAuth}
        className="w-full rounded-lg border border-white/10 bg-slate-900/70 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </div>
      </button>

      {isSignUp && (
        <p className="mt-4 text-center text-xs text-slate-400">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      )}
    </div>
  );
}
