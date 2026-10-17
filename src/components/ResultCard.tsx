"use client";

import Image from "next/image";
import type { FareResult } from "@/types";

interface ResultCardProps {
  result: FareResult;
  isBestDeal?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width={16} height={16}>
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
    </svg>
  );
}

export default function ResultCard({ result, isBestDeal, isSelected, onSelect }: ResultCardProps) {
  const iconPath = result.icon ? `/icons/${result.icon}` : null;
  const isHighlight = isBestDeal || isSelected;

  return (
    <div
      className={`cyber-glass flex flex-col rounded-2xl p-4 transition-all shadow-xl ${
        isHighlight
          ? "border-amber-400/40 bg-amber-950/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {iconPath ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 p-1">
              <Image
                src={iconPath}
                alt={result.provider}
                width={40}
                height={40}
                className="object-contain"
                unoptimized
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
              <span
                className="absolute inset-0 hidden items-center justify-center text-sm font-bold text-slate-400"
                style={{ display: "none" }}
              >
                {result.provider[0]}
              </span>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 text-sm font-bold text-slate-400">
              {result.provider[0]}
            </div>
          )}
          <div>
            <p className="flex items-center gap-1 text-sm font-bold text-white">
              {result.provider}
              {isBestDeal && <CrownIcon className="text-amber-400" />}
            </p>
            <p className="font-mono text-[10px] text-slate-400">ETA: {result.duration.replace("~", "")}</p>
          </div>
        </div>
        <p className="text-lg font-black text-white">Rs {result.price}</p>
      </div>

      <a
        href={result.bookingUrl || "#"}
        target="_blank"
        rel="noreferrer"
        onClick={onSelect}
        className={`mt-2 rounded-xl py-2 text-center text-xs font-bold transition ${
          isSelected || isBestDeal
            ? "bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            : "border border-white/10 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white"
        }`}
      >
        Select Ride
      </a>
    </div>
  );
}
