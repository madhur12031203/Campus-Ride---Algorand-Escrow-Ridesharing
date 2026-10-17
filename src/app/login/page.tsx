"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VideoBackground from "@/components/VideoBackground";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createDemoSession, getDemoUser } from "@/lib/auth/demoAuth";

export default function LoginPage() {
  const router = useRouter();
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    const demoUser = getDemoUser();
    if (demoUser) {
      router.replace("/");
      return;
    }

    const hasSupabase = isSupabaseConfigured();
    setSupabaseReady(hasSupabase);

    if (hasSupabase) {
      try {
        const supabase = createClient();
        void supabase.auth.getUser().then(({ data }) => {
          if (data?.user) {
            router.replace("/");
          }
        }).catch(() => undefined);
      } catch {
        // Safe fallback
      }
    }
  }, [router]);

  function handleQuickDemo(role: "driver" | "passenger") {
    createDemoSession(role);
    window.location.href = "/";
  }

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

        <div className="mt-4 flex items-center justify-center">
          {supabaseReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Supabase Auth Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 font-mono text-[11px] text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Instant Demo Access Ready &bull; .env.local optional
            </span>
          )}
        </div>

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

        <div className="mt-6 rounded-2xl border border-white/5 bg-slate-950/50 p-4">
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-slate-400 mb-3">
            Quick 1-Click Access (Bypass Login)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickDemo("driver")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-900/40 hover:border-cyan-400"
            >
              <span>⚡</span> Demo Driver Access
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("passenger")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-900/40 hover:border-emerald-400"
            >
              <span>⚡</span> Demo Passenger Access
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
