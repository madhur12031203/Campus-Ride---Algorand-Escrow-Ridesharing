"use client";

import { useEffect, useMemo, useState } from "react";
import { usePeraWallet } from "@/hooks/usePeraWallet";

type WalletPanelProps = {
  appId?: number;
  appAddress?: string;
  onAddressChange?: (address: string | null) => void;
};

function shortenAddress(value: string): string {
  return `${value.slice(0, 5)}...${value.slice(-4)}`;
}

function WalletIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="h-3.5 w-3.5 text-slate-400 hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

export default function WalletPanel({
  appId = Number(process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ID ?? 0),
  appAddress = process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS ?? "",
  onAddressChange,
}: WalletPanelProps) {
  const [copied, setCopied] = useState(false);

  const isConfigValid = useMemo(
    () => Number.isFinite(appId) && appId > 0 && appAddress.length > 0,
    [appAddress, appId]
  );

  const { address, isConnecting, connectWallet, disconnectWallet } = usePeraWallet({
    appId,
    appAddress,
  });

  useEffect(() => {
    onAddressChange?.(address);
  }, [address, onAddressChange]);

  const handleCopy = () => {
    if (!address) return;
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConfigValid) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 backdrop-blur-md">
        <p className="text-xs text-amber-300">
          ⚠️ Algorand Escrow configuration incomplete. Set NEXT_PUBLIC_RIDE_ESCROW_APP_ID and NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS.
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-glass rounded-2xl p-4 shadow-xl border border-white/10 hover:border-emerald-500/25 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative grid h-11 w-11 place-items-center rounded-xl border border-emerald-500/25 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <WalletIcon />
            {address && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Pera Wallet</p>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-mono font-medium text-emerald-300 border border-emerald-500/30">
                Testnet
              </span>
            </div>
            {address ? (
              <div className="mt-0.5 flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-slate-100" title={address}>
                  {shortenAddress(address)}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Copy full address"
                  className="rounded p-1 hover:bg-slate-800 transition"
                >
                  <CopyIcon />
                </button>
                {copied && <span className="text-[10px] text-emerald-400">Copied!</span>}
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-slate-400">Required for escrow trust layer</p>
            )}
          </div>
        </div>

        {address ? (
          <button
            type="button"
            onClick={() => void disconnectWallet()}
            className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/50"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void connectWallet()}
            disabled={isConnecting}
            className="cyber-button rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "Connect Pera"}
          </button>
        )}
      </div>
    </div>
  );
}
