"use client";

import { useEffect, useMemo, useState } from "react";
import { sendEscrowPayment } from "@/lib/algorand/escrow";
import {
  fetchMyRideBookings,
  markEscrowLocked,
  subscribeToMyRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

type PassengerRideStatusProps = {
  passengerId: string;
  isBusy: boolean;
  onCompleteRide: (ride: RideBookingRow) => Promise<void>;
  paymentMessage?: string | null;
  walletAddress: string | null;
  appAddress: string;
  onToast: (message: string, tone?: "success" | "info" | "error") => void;
};

const ACTIVE_STATUSES: RideBookingRow["status"][] = ["waiting", "accepted"];

function StatusBadge({ status }: { status: RideBookingRow["status"] }) {
  const configs = {
    waiting: {
      bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      dot: "bg-amber-400 animate-pulse",
      label: "Waiting for Driver",
    },
    accepted: {
      bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
      dot: "bg-cyan-400 animate-pulse",
      label: "Driver Assigned",
    },
    completed: {
      bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
      dot: "bg-emerald-400",
      label: "Completed",
    },
    cancelled: {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
      dot: "bg-rose-400",
      label: "Cancelled",
    },
  };

  const current = configs[status] ?? configs.waiting;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-mono font-medium ${current.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export default function PassengerRideStatus({
  passengerId,
  isBusy,
  onCompleteRide,
  paymentMessage,
  walletAddress,
  appAddress,
  onToast,
}: PassengerRideStatusProps) {
  const [rides, setRides] = useState<RideBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lockingRideId, setLockingRideId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchMyRideBookings(passengerId)
      .then((data) => setRides(data))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load rides"))
      .finally(() => setLoading(false));
  }, [onToast, passengerId]);

  useEffect(() => {
    const unsubscribe = subscribeToMyRideBookings(passengerId, (ride) => {
      setRides((prev) => {
        const exists = prev.some((value) => value.id === ride.id);
        if (exists) {
          const current = prev.find((value) => value.id === ride.id);
          if (current && current.status !== "accepted" && ride.status === "accepted") {
            onToast("Ride accepted", "success");
          }
          return prev.map((value) => (value.id === ride.id ? ride : value));
        }
        return [ride, ...prev];
      });
    });

    return unsubscribe;
  }, [onToast, passengerId]);

  const activeRide = useMemo(() => {
    const candidates = rides
      .filter((ride) => ACTIVE_STATUSES.includes(ride.status))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return candidates[0] ?? null;
  }, [rides]);

  const historyRides = useMemo(
    () =>
      rides
        .filter((ride) => !ACTIVE_STATUSES.includes(ride.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [rides]
  );

  useEffect(() => {
    if (!activeRide || activeRide.status !== "accepted") return;
    if (activeRide.escrow_state !== "pending_lock") return;
    if (!walletAddress || walletAddress !== activeRide.passenger_wallet) return;
    if (lockingRideId === activeRide.id) return;
    if (!appAddress) return;

    setLockingRideId(activeRide.id);
    void (async () => {
      try {
        const txnId = await sendEscrowPayment({
          senderAddress: walletAddress,
          appAddress,
          fare: 60,
        });
        await markEscrowLocked(activeRide.id, passengerId, txnId);
        onToast("Escrow locked", "success");
      } catch (lockError) {
        const message =
          lockError instanceof Error ? lockError.message : "Failed to lock escrow";
        setError(message);
        onToast("Escrow lock failed", "error");
      } finally {
        setLockingRideId(null);
      }
    })();
  }, [activeRide, appAddress, lockingRideId, onToast, passengerId, walletAddress]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Loading your rides...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
        ⚠️ {error}
      </div>
    );
  }

  if (rides.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
        {activeRide ? "⚡ Live Trip Terminal" : "📜 Ride History"}
      </h3>
      {paymentMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs text-emerald-300">
          ✨ {paymentMessage}
        </div>
      )}
      {activeRide ? (
        <article className="cyber-glass rounded-2xl p-5 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="mb-4 flex items-center justify-between">
            <StatusBadge status={activeRide.status} />
            <span className="font-mono text-[11px] text-slate-400">
              {new Date(activeRide.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="space-y-3 rounded-xl bg-slate-900/60 p-3.5 border border-white/5 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">●</span>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Pickup Location</p>
                <p className="font-medium text-white">{activeRide.pickup_place_name || "Pickup location"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 border-t border-white/5 pt-2">
              <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400">■</span>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Destination</p>
                <p className="font-medium text-white">{activeRide.destination_place_name || "Destination location"}</p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Smart Escrow State:</span>
            <span className="font-semibold text-emerald-400">
              {activeRide.escrow_state === "locked"
                ? "🔒 Locked in Contract"
                : activeRide.escrow_state === "released"
                  ? "💸 Released to Driver"
                  : "⏳ Pending Driver Lock"}
            </span>
          </div>

          {activeRide.status === "accepted" && !activeRide.passenger_completed && (
            <button
              type="button"
              onClick={() => void onCompleteRide(activeRide)}
              disabled={isBusy}
              className="cyber-button mt-4 w-full rounded-xl py-3 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✅ Confirm Drop & Release Escrow
            </button>
          )}
          {activeRide.status === "accepted" &&
            activeRide.escrow_state === "pending_lock" &&
            (!walletAddress || walletAddress !== activeRide.passenger_wallet) && (
              <p className="mt-2.5 text-xs text-amber-300 font-mono">
                Connect the passenger wallet ({activeRide.passenger_wallet ? `${activeRide.passenger_wallet.slice(0, 6)}...` : "needed"}) to lock escrow.
              </p>
            )}
          {activeRide.status === "accepted" &&
            activeRide.passenger_completed &&
            !activeRide.driver_completed && (
              <p className="mt-3 text-xs text-cyan-300 font-mono">
                ⏳ You confirmed drop-off. Awaiting driver confirmation to complete settlement.
              </p>
            )}
        </article>
      ) : (
        historyRides.slice(0, 5).map((ride) => (
          <article
            key={ride.id}
            className="cyber-glass rounded-xl p-3.5 border border-white/5 transition hover:border-white/10"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <StatusBadge status={ride.status} />
              <span className="font-mono text-[10px] text-slate-400">
                {new Date(ride.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              {ride.pickup_place_name || "Pickup"} → {ride.destination_place_name || "Drop"}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
