"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BestDealCard from "@/components/BestDealCard";
import ChatWidget from "@/components/ChatWidget";
import LocationForm from "@/components/LocationForm";
import ResultCard from "@/components/ResultCard";
import VideoBackground from "@/components/VideoBackground";
import WalletPanel from "@/components/WalletPanel";
import CoreRideSharePanel from "@/components/rideshare/CoreRideSharePanel";
import { createClient } from "@/lib/supabase/client";
import type { FareResult, LocationInput } from "@/types";

type CompareApiResponse = {
  results: FareResult[];
  error?: string;
};

const AUTH_CHECK_TIMEOUT_MS = 6000;

function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error(message)),
      AUTH_CHECK_TIMEOUT_MS,
    );

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId));
  });
}

export default function Dashboard() {
  const [results, setResults] = useState<FareResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);


  useEffect(() => {
    try {
      const supabase = createClient();

      void withTimeout(
        supabase.auth.getSession(),
        "Login check timed out. Check your internet connection and Supabase settings.",
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

  const bestDeal =
    results.length > 0
      ? results.reduce((min, result) =>
          result.price < min.price ? result : min,
        )
      : null;

  async function handleCompare(data: LocationInput) {
    setIsLoading(true);
    setCompareError(null);
    setResults([]);
    setSelectedProvider(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: CompareApiResponse = await res.json();

      if (!res.ok) {
        setCompareError(
          json.error || "Unable to compare fares. Please try again.",
        );
        return;
      }

      if (json.results?.length) {
        setResults(json.results);

        const cheapest = json.results.reduce(
          (min: FareResult, result: FareResult) =>
            result.price < min.price ? result : min,
        );
        setSelectedProvider(cheapest.provider);
      }
    } catch (error) {
      setCompareError(
        error instanceof Error ? error.message : "Unable to compare fares.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthLoading) {
    return (
      <main id="main-content" className="auth-page text-center">
        <p>Checking your account…</p>
      </main>
    );
  }

  if (!isSignedIn) {
    return (
      <main id="main-content" className="auth-page text-center">
        <h1 className="text-3xl mb-4">Your rides, in one place.</h1>
        <p className="mb-6">
          Sign in to access your dashboard, or explore the demo preview.
        </p>
        <Link className="button-primary" href="/login">
          Sign in →
        </Link>{" "}
        <Link className="button-secondary" href="/demo">
          Explore demo
        </Link>
      </main>
    );
  }

  return (
    <main
      id="main-content"
      className="dashboard-page relative isolate min-h-screen text-slate-950"
    >
      <VideoBackground />
      <ChatWidget />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-sm font-black text-teal-700">
              CR
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                Campus Ride
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">
                Book a ride, offer a seat, and manage your campus journeys.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-white text-center shadow-sm">
            <div className="px-3 py-2">
              <p className="text-[11px] uppercase text-slate-500">Network</p>
              <p className="text-sm font-semibold text-teal-700">Testnet</p>
            </div>
            <div className="border-x border-slate-200 px-3 py-2">
              <p className="text-[11px] uppercase text-slate-500">Escrow</p>
              <p className="text-sm font-semibold text-emerald-700">
                Integration pending
              </p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[11px] uppercase text-slate-500">Wallet</p>
              <p className="text-sm font-semibold text-cyan-700">
                {walletAddress ? "Connected" : "Optional"}
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-teal-700">
                  Realtime dispatch
                </p>
                <h2 className="text-xl font-semibold text-slate-950">
                  Your dashboard
                </h2>
              </div>
              <p className="text-sm text-slate-600">
                Choose passenger or driver to get started.
              </p>
            </div>
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              You can request and accept rides without a wallet. Testnet escrow payments are disabled.
            </p>
            <CoreRideSharePanel walletAddress={walletAddress} />
          </section>

          <aside className="space-y-5">
            <WalletPanel onAddressChange={setWalletAddress} />

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Fare tools
                </p>
                <h2 className="text-lg font-semibold text-slate-950">
                  Compare fares
                </h2>
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Illustrative estimates, not live provider quotes.
              </p>
              <LocationForm onSubmit={handleCompare} isLoading={isLoading} />
              {compareError && (
                <p role="alert" className="mt-3 text-sm text-rose-700">
                  {compareError}
                </p>
              )}
            </section>

            {bestDeal && <BestDealCard result={bestDeal} />}

            {results.length > 0 && (
              <div className="grid gap-3">
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
              <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 text-center">
                <p className="text-sm text-slate-600">
                  Enter pickup and drop locations to compare prices.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
