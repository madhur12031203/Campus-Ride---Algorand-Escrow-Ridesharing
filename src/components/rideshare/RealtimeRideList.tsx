"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  acceptRide,
  driverHasActiveRide,
  fetchDriverActiveRide,
  fetchWaitingRideBookings,
  haversineDistanceKm,
  subscribeToRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

const MAX_DISTANCE_KM = 8;
type RideWithDistance = RideBookingRow & { distanceKm: number };

type RealtimeRideListProps = {
  driverLat: number;
  driverLng: number;
  isBusy: boolean;
  onCompleteRide: (ride: RideBookingRow) => Promise<void>;
  paymentMessage?: string | null;
  driverWalletAddress: string | null;
  onToast: (message: string, tone?: "success" | "info" | "error") => void;
};

export default function RealtimeRideList({
  driverLat,
  driverLng,
  isBusy,
  onCompleteRide,
  paymentMessage,
  driverWalletAddress,
  onToast,
}: RealtimeRideListProps) {
  const [rides, setRides] = useState<RideWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<RideBookingRow | null>(null);
  const [blockedByActiveRide, setBlockedByActiveRide] = useState(false);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);

  const refreshDriverRideState = useCallback(
    async (nextDriverId: string) => {
      const [hasActive, ride] = await Promise.all([
        driverHasActiveRide(nextDriverId),
        fetchDriverActiveRide(nextDriverId),
      ]);
      setBlockedByActiveRide(hasActive);
      setActiveRide(ride);
    },
    []
  );

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      setDriverId(data.user.id);
      void refreshDriverRideState(data.user.id).catch(() => {
        setError("Failed to load current ride");
      });
    });
  }, [refreshDriverRideState]);

  const addRideWithDistance = useCallback(
    (ride: RideBookingRow) => {
      if (ride.status !== "waiting" || ride.driver_id) return;
      if (rejectedRideIds.includes(ride.id)) return;
      const distanceKm = haversineDistanceKm(
        driverLat,
        driverLng,
        ride.origin_lat,
        ride.origin_lng
      );
      if (distanceKm > MAX_DISTANCE_KM) return;
      setRides((prev) => {
        if (prev.some((value) => value.id === ride.id)) return prev;
        return [{ ...ride, distanceKm }, ...prev].sort((a, b) => a.distanceKm - b.distanceKm);
      });
    },
    [driverLat, driverLng, rejectedRideIds]
  );

  const handleRideUpdate = useCallback(
    (ride: RideBookingRow) => {
      setRides((prev) => prev.filter((value) => value.id !== ride.id));
      if (driverId && ride.driver_id === driverId) {
        void refreshDriverRideState(driverId).catch(() => undefined);
      }
    },
    [driverId, refreshDriverRideState]
  );

  useEffect(() => {
    setError(null);
    setLoading(true);
    fetchWaitingRideBookings()
      .then((data) => {
        const withDistance = data
          .map((ride) => ({
            ...ride,
            distanceKm: haversineDistanceKm(
              driverLat,
              driverLng,
              ride.origin_lat,
              ride.origin_lng
            ),
          }))
          .filter((ride) => !rejectedRideIds.includes(ride.id))
          .filter((ride) => ride.distanceKm <= MAX_DISTANCE_KM)
          .sort((a, b) => a.distanceKm - b.distanceKm);
        setRides(withDistance);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load rides"))
      .finally(() => setLoading(false));
  }, [driverLat, driverLng, rejectedRideIds]);

  useEffect(() => {
    const unsubscribe = subscribeToRideBookings(addRideWithDistance, handleRideUpdate);
    return unsubscribe;
  }, [addRideWithDistance, handleRideUpdate]);

  const handleAcceptRide = useCallback(
    async (rideId: string) => {
      if (!driverId) {
        setError("Please sign in to accept rides");
        return;
      }
      if (!driverWalletAddress) {
        setError("Connect wallet before accepting rides");
        return;
      }
      if (blockedByActiveRide) {
        setError("Finish your current ride first");
        return;
      }

      setError(null);
      try {
        await acceptRide(rideId, driverId, driverWalletAddress);
        await refreshDriverRideState(driverId);
        setRides((prev) => prev.filter((value) => value.id !== rideId));
        onToast("Ride accepted", "success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept ride");
      } finally {
        // no-op
      }
    },
    [blockedByActiveRide, driverId, driverWalletAddress, onToast, refreshDriverRideState]
  );

  const handleRejectRide = useCallback(
    (rideId: string) => {
      setRejectedRideIds((prev) => (prev.includes(rideId) ? prev : [...prev, rideId]));
      setRides((prev) => prev.filter((ride) => ride.id !== rideId));
      onToast("Ride hidden from your queue", "info");
    },
    [onToast]
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Loading nearby rides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}
      {paymentMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {paymentMessage}
        </div>
      )}
      {activeRide ? (
        <article className="cyber-glass rounded-2xl p-5 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-28 w-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="mb-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-mono text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              Active Assigned Trip
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {new Date(activeRide.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="space-y-3 rounded-xl bg-slate-900/60 p-3.5 border border-white/5 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-500/20 text-[10px] text-emerald-400">●</span>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase">Pickup</p>
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
            <span className="text-slate-400">Escrow State:</span>
            <span className="font-semibold text-emerald-400">
              {activeRide.escrow_state === "locked"
                ? "🔒 Locked in Contract"
                : activeRide.escrow_state === "released"
                  ? "💸 Released to You"
                  : "⏳ Waiting for passenger lock"}
            </span>
          </div>
          {!activeRide.driver_completed && (
            <button
              type="button"
              onClick={() => void onCompleteRide(activeRide)}
              disabled={isBusy}
              className="cyber-button mt-4 w-full rounded-xl py-3 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              🏁 Confirm Passenger Dropped
            </button>
          )}
          {activeRide.driver_completed && !activeRide.passenger_completed && (
            <p className="mt-3 text-xs text-amber-300 font-mono">
              ⏳ You marked drop complete. Awaiting passenger confirmation to trigger Algorand contract payout.
            </p>
          )}
        </article>
      ) : (
        <>
          <div className="border-b border-white/10 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Live Nearby Requests</h2>
              <span className="font-mono text-[10px] text-cyan-400">≤ {MAX_DISTANCE_KM} km radius</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Review real-time requests from campus passengers. Guaranteed payout upon drop confirmation.
            </p>
          </div>
          {rides.length === 0 ? (
            <div className="cyber-glass rounded-2xl p-8 text-center border border-dashed border-white/10">
              <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                📡
              </div>
              <p className="text-xs text-slate-300 font-medium">Scanning for campus ride requests...</p>
              <p className="text-[11px] text-slate-500 mt-1">New passenger bookings will appear instantly over realtime socket.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <article
                  key={ride.id}
                  className="cyber-glass rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all shadow-xl"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Pending Driver
                    </span>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                      {ride.distanceKm.toFixed(2)} km away
                    </span>
                  </div>
                  <div className="mb-3 space-y-1.5 text-xs">
                    <p className="text-slate-300">
                      <span className="font-mono text-slate-500 uppercase text-[10px]">From:</span>{" "}
                      <span className="font-medium text-white">{ride.pickup_place_name || "Pickup location"}</span>
                    </p>
                    <p className="text-slate-300">
                      <span className="font-mono text-slate-500 uppercase text-[10px]">To:</span>{" "}
                      <span className="font-medium text-white">{ride.destination_place_name || "Destination location"}</span>
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleAcceptRide(ride.id)}
                      disabled={Boolean(isBusy || blockedByActiveRide || !driverWalletAddress)}
                      className="cyber-button rounded-xl py-2.5 text-xs font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ⚡ Accept Ride
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRide(ride.id)}
                      disabled={Boolean(isBusy)}
                      className="rounded-xl border border-white/10 bg-slate-900/60 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-40"
                    >
                      Dismiss
                    </button>
                  </div>
                  {blockedByActiveRide && (
                    <p className="mt-2 text-[11px] text-amber-300 font-mono">⚠️ Complete your current trip before accepting new requests.</p>
                  )}
                  {!driverWalletAddress && (
                    <p className="mt-2 text-[11px] text-amber-300 font-mono">🔒 Connect Pera Wallet above to accept trip escrows.</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
