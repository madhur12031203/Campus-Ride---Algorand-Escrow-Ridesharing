"use client";

import Image from "next/image";
import type { FareResult } from "@/types";

interface BestDealCardProps {
  result: FareResult;
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
    </svg>
  );
}

export default function BestDealCard({ result }: BestDealCardProps) {
  const iconPath = result.icon ? `/icons/${result.icon}` : null;
  const duration = result.duration?.replace("~", "") ?? "--";

  return (
    <div className="cyber-glass relative overflow-hidden rounded-2xl border border-amber-400/35 bg-amber-950/20 p-4 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
      <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300">
        <CrownIcon className="text-amber-400" />
        Optimal Campus Deal
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {iconPath ? (
            <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-amber-400/30 bg-slate-900/80 p-1 shadow-md">
              <Image
                src={iconPath}
                alt={result.provider}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <span
                className="absolute inset-0 hidden items-center justify-center text-lg font-bold text-slate-400"
                style={{ display: "none" }}
              >
                {result.provider[0]}
              </span>
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-400/30 bg-slate-900/80 text-lg font-bold text-slate-400">
              {result.provider[0]}
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 text-base font-bold text-white">
              {result.provider}
            </p>
            <p className="text-2xl font-black text-amber-300">Rs {result.price}</p>
            <p className="font-mono text-[11px] text-slate-400">ETA: {duration}</p>
          </div>
        </div>
        <a
          href={result.bookingUrl || "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition hover:brightness-110"
        >
          Book Deal
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </div>
  );
}
