"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BestDealCard from "@/components/BestDealCard";
import ChatWidget from "@/components/ChatWidget";
import LocationForm from "@/components/LocationForm";
import ResultCard from "@/components/ResultCard";
import VideoBackground from "@/components/VideoBackground";
import WalletPanel from "@/components/WalletPanel";
import CoreRideSharePanel from "@/components/rideshare/CoreRideSharePanel";
import { createClient } from "@/lib/supabase/client";
import { getDemoUser } from "@/lib/auth/demoAuth";
import type { FareResult, LocationInput } from "@/types";

type CompareApiResponse = {
  results: FareResult[];
};

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

function AppLoadingState({ label }: { label: string }) {
  return (
    <main className="relative isolate min-h-screen text-slate-100 flex items-center justify-center">
      <VideoBackground />
      <div className="relative z-10 mx-auto max-w-md px-6 text-center">
        <div className="cyber-glass rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mb-4" />
          <p className="font-mono text-xs text-slate-300">{label}</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  const router = useRouter();
  const [results, setResults] = useState<FareResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const appAddress = process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS ?? "";
  const appId = process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ID ?? "755776791";

  useEffect(() => {
    const demoUser = getDemoUser();
    if (demoUser) {
      setIsSignedIn(true);
      setIsAuthLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      void withTimeout(
        supabase.auth.getSession(),
        "Login check timed out. Check your internet connection and Supabase settings."
      )
        .then(({ data }) => {
          setIsSignedIn(Boolean(data.session?.user));
        })
        .catch(() => {
          setIsSignedIn(false);
        })
        .finally(() => {
          setIsAuthLoading(false);
        });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsSignedIn(Boolean(session?.user));
        setIsAuthLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch {
      setIsSignedIn(false);
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !isSignedIn) {
      router.replace("/login");
    }
  }, [isAuthLoading, isSignedIn, router]);

  const bestDeal =
    results.length > 0
      ? results.reduce((min, result) => (result.price < min.price ? result : min))
      : null;

  async function handleCompare(data: LocationInput) {
    setIsLoading(true);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: CompareApiResponse = await res.json();

      if (!res.ok) {
        console.error("Compare API failed:", res.status, json);
        return;
      }

      if (json.results?.length) {
        setResults(json.results);

        const cheapest = json.results.reduce((min: FareResult, result: FareResult) =>
          result.price < min.price ? result : min
        );
        setSelectedProvider(cheapest.provider);
      }
    } catch (error) {
      console.error("Compare failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthLoading) {
    return <AppLoadingState label="Synchronizing Campus Ride network & wallet state..." />;
  }

  if (!isSignedIn) {
    return <AppLoadingState label="Redirecting to secure login..." />;
  }

  return (
    <main className="relative isolate min-h-screen text-slate-100">
      <VideoBackground />
      <ChatWidget />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Futuristic Cyber Navigation Header */}
        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <span className="text-base font-black tracking-wider">CR</span>
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  Campus<span className="text-emerald-400">Ride</span>
                </h1>
                <span className="rounded-full bg-slate-800/80 border border-white/10 px-2 py-0.5 text-[9px] font-mono uppercase text-slate-400">
                  v2.0 Escrow
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                P2P campus mobility with cryptographically secured smart contract escrow.
              </p>
            </div>
          </div>

          {/* Network & Escrow Status Badges */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="cyber-glass rounded-xl px-3 py-2 border border-white/10 text-center">
              <p className="text-[9px] font-mono uppercase text-slate-500">Chain</p>
              <p className="text-xs font-mono font-bold text-teal-300">Algorand</p>
            </div>
            <div className="cyber-glass rounded-xl px-3 py-2 border border-white/10 text-center">
              <p className="text-[9px] font-mono uppercase text-slate-500">Contract ID</p>
              <p className="text-xs font-mono font-bold text-emerald-400">#{appId}</p>
            </div>
            <div className="cyber-glass rounded-xl px-3 py-2 border border-white/10 text-center">
              <p className="text-[9px] font-mono uppercase text-slate-500">Settlement</p>
              <p className="text-xs font-mono font-bold text-cyan-300">
                {appAddress ? "Immutable" : "Active"}
              </p>
            </div>
          </div>
        </header>

        {/* Main Grid: Core Panel + Aside Tools */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(330px,0.9fr)]">
          <section className="cyber-glass rounded-2xl p-5 border border-white/10 shadow-2xl">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Realtime Dispatch Terminal</p>
                <h2 className="text-lg font-bold text-white">Campus Rideshare Dashboard</h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {walletAddress ? "● Wallet Linked" : "⚠️ Connect Wallet to Transact"}
              </p>
            </div>
            <CoreRideSharePanel walletAddress={walletAddress} appAddress={appAddress} />
          </section>

          <aside className="space-y-5">
            <WalletPanel onAddressChange={setWalletAddress} />

            <section className="cyber-glass rounded-2xl p-4 border border-white/10 shadow-xl">
              <div className="mb-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Campus Fare Intelligence</p>
                <h3 className="text-sm font-bold text-white">Compare Multi-Platform Prices</h3>
              </div>
              <LocationForm onSubmit={handleCompare} isLoading={isLoading} />
            </section>

            {bestDeal && <BestDealCard result={bestDeal} />}

            {results.length > 0 && (
              <div className="grid gap-2.5">
                {results.map((result) => (
                  <ResultCard
                    key={result.provider}
                    result={result}
                    isBestDeal={bestDeal?.provider === result.provider}
                    isSelected={selectedProvider === result.provider}
                    onSelect={() => setSelectedProvider(result.provider)}
                  />
                ))}
              </div>
            )}

            {results.length === 0 && !isLoading && (
              <div className="cyber-glass rounded-2xl p-4 text-center border border-dashed border-white/10">
                <p className="text-xs text-slate-400">
                  Select pickup and drop destinations to calculate optimal campus rates.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
