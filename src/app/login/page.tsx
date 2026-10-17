"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VideoBackground from "@/components/VideoBackground";
import { createClient } from "@/lib/supabase/client";

const AUTH_CHECK_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(message)), AUTH_CHECK_TIMEOUT_MS);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      void withTimeout(
        supabase.auth.getUser(),
        "Login check timed out. Check your internet connection and Supabase settings."
      )
        .then(({ data }) => {
          if (data.user) {
            router.replace("/");
          }
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Unable to check login status.");
        });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to check login status.");
    }
  }, [router]);

  return (
    <main className="relative isolate flex min-h-screen flex-col items-center justify-center px-6">
      <VideoBackground />
      <div className="cyber-glass relative z-10 w-full max-w-2xl rounded-3xl p-8 border border-white/10 shadow-2xl backdrop-blur-2xl sm:p-10">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-black text-xl shadow-[0_0_25px_rgba(16,185,129,0.25)]">
          CR
        </div>
        <h1 className="text-center text-3xl font-black tracking-tight text-white sm:text-4xl">
          Campus<span className="text-emerald-400">Ride</span>
        </h1>
        <p className="mt-2 text-center text-xs text-slate-400 font-mono">
          Decentralized Campus Ridesharing &bull; Algorand Smart Escrow
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs text-rose-300">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/login/driver"
            className="group rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-6 transition-all hover:border-cyan-400/60 hover:bg-cyan-950/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
          >
            <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              🚘
            </div>
            <p className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Campus Driver</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Accept requests, coordinate rides, and earn ALGO with instant automated settlement.
            </p>
          </Link>
          <Link
            href="/login/passenger"
            className="group rounded-2xl border border-emerald-500/20 bg-slate-900/60 p-6 transition-all hover:border-emerald-400/60 hover:bg-emerald-950/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
          >
            <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              🎒
            </div>
            <p className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Campus Passenger</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Book campus rides safely. Payment remains securely in escrow until ride drop-off.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
