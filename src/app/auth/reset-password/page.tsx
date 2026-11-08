"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("Checking your recovery link…");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();
      const check = async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) {
          setReady(Boolean(data.session));
          setMessage(
            data.session
              ? "Choose a new password."
              : "This recovery link is missing or expired. Request another from the sign-in page.",
          );
        }
      };
      void check().catch(() => {
        if (active)
          setMessage(
            "Unable to open this recovery link. Please request a new one.",
          );
      });
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" && active) {
          setReady(true);
          setMessage("Choose a new password.");
        }
      });
      return () => {
        active = false;
        subscription.unsubscribe();
      };
    } catch {
      setMessage("Account services are not configured yet.");
    }
    return () => {
      active = false;
    };
  }, []);
  return (
    <main id="main-content" className="auth-page flex justify-center">
      <section className="auth-shell">
        <div className="auth-card">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p role="status" className="my-4 text-sm">
            {message}
          </p>
          {ready && !done && (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                try {
                  const { error } = await createClient().auth.updateUser({
                    password,
                  });
                  if (error) throw error;
                  setDone(true);
                  setMessage(
                    "Password updated. You can now return to your dashboard.",
                  );
                } catch (error) {
                  setMessage(
                    error instanceof Error
                      ? error.message
                      : "Unable to update password.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label htmlFor="new-password" className="block text-sm mb-2">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border rounded-lg p-3 mb-4"
              />
              <button disabled={busy} className="button-primary">
                {busy ? "Saving…" : "Update password"}
              </button>
            </form>
          )}
          <Link href={done ? "/dashboard" : "/login"} className="text-link">
            {done ? "Go to dashboard" : "Back to sign in"} →
          </Link>
        </div>
      </section>
    </main>
  );
}
