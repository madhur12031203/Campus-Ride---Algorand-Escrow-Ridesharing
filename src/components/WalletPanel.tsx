"use client";

import { useEffect, useState } from "react";
import { usePeraWallet } from "@/hooks/usePeraWallet";

type WalletPanelProps = {
  appId?: number;
  appAddress?: string;
  onAddressChange?: (address: string | null) => void;
};

function shortenAddress(value: string): string {
  return `${value.slice(0, 4)}...${value.slice(-3)}`;
}

function WalletIcon() {
  return (
    <svg className="h-5 w-5 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function WalletPanel({
  appId = Number(process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ID ?? 0),
  appAddress = process.env.NEXT_PUBLIC_RIDE_ESCROW_APP_ADDRESS ?? "",
  onAddressChange,
}: WalletPanelProps) {
  const [error, setError] = useState<string | null>(null);

  const { address, isConnecting, connectWallet, disconnectWallet } = usePeraWallet({
    appId,
    appAddress,
  });

  useEffect(() => {
    onAddressChange?.(address);
  }, [address, onAddressChange]);

  async function handleWalletAction() {
    setError(null);
    try {
      if (address) await disconnectWallet();
      else await connectWallet();
    } catch {
      setError(address ? "Couldn’t disconnect. Try again." : "Couldn’t connect to Pera Wallet. Try again.");
    }
  }

  return (
    <div className="workspace-surface">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-teal-200 bg-teal-50">
            <WalletIcon />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Algorand wallet</p>
            {address ? (
              <p className="mt-0.5 text-sm font-semibold text-slate-950" title={address}>
                {shortenAddress(address)}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-slate-600">Optional for rides</p>
            )}
          </div>
        </div>
        {address ? (
          <div className="flex items-center gap-2">
            <CheckIcon />
            <button
              type="button"
              onClick={() => void handleWalletAction()}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => void handleWalletAction()}
            disabled={isConnecting}
            className="ride-button disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
    </div>
  );
}
