"use client";

import { useEffect, useRef, useState } from "react";
import { ESCROW_PAYMENTS_ENABLED } from "@/lib/algorand/escrow";
import {
  acceptRide,
  fetchDriverActiveRide,
  fetchDriverRideHistory,
  fetchWaitingRideBookings,
  haversineDistanceKm,
  subscribeToRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

const MAX_DISTANCE_KM = 8;
type RideWithDistance = RideBookingRow & { distanceKm: number };

type RealtimeRideListProps = {
  driverId: string;
  driverLat: number | null;
  driverLng: number | null;
  isBusy: boolean;
  onCompleteRide: (ride: RideBookingRow) => Promise<RideBookingRow | undefined>;
  driverWalletAddress: string | null;
  onToast: (message: string, tone?: "success" | "info" | "error") => void;
};

export default function RealtimeRideList({
  driverId,
  driverLat,
  driverLng,
  isBusy,
  onCompleteRide,
  driverWalletAddress,
  onToast,
}: RealtimeRideListProps) {
  const [waitingRides, setWaitingRides] = useState<RideBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<RideBookingRow | null>(null);
  const [history, setHistory] = useState<RideBookingRow[]>([]);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [accepting, setAccepting] = useState(false);
  const requestVersion = useRef(0);
  const hasLocation = driverLat !== null && driverLng !== null;
  const needsWallet = ESCROW_PAYMENTS_ENABLED && !driverWalletAddress;

  const rides: RideWithDistance[] = driverLat === null || driverLng === null
    ? []
    : waitingRides
        .filter((ride) => !rejectedRideIds.includes(ride.id))
        .map((ride) => ({
          ...ride,
          distanceKm: haversineDistanceKm(driverLat, driverLng, ride.origin_lat, ride.origin_lng),
        }))
        .filter((ride) => ride.distanceKm <= MAX_DISTANCE_KM)
        .sort((a, b) => a.distanceKm - b.distanceKm);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const version = ++requestVersion.current;
      try {
        const [current, previous, waiting] = await Promise.all([
          fetchDriverActiveRide(driverId),
          fetchDriverRideHistory(driverId),
          hasLocation ? fetchWaitingRideBookings() : Promise.resolve([]),
        ]);
        if (mounted && version === requestVersion.current) {
          setLoadError(null);
          setActiveRide(current);
          setHistory(previous);
          setWaitingRides(waiting);
        }
      } catch {
        if (mounted && version === requestVersion.current) {
          setLoadError("Could not refresh rides. The app will try again automatically.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void refresh();
    const unsubscribe = subscribeToRideBookings(
      () => { if (hasLocation) void refresh(); },
      (ride) => { if (hasLocation || ride.driver_id === driverId) void refresh(); },
      () => void refresh(),
    );
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    // Recheck the queue because another driver's accepted row is no longer visible to us.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 20000);
    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [driverId, hasLocation]);

  function rememberRide(ride: RideBookingRow) {
    requestVersion.current += 1;
    if (ride.status === "accepted") {
      setActiveRide(ride);
    } else {
      setActiveRide(null);
      setHistory((previous) => [ride, ...previous.filter((item) => item.id !== ride.id)]);
    }
  }

  async function handleAcceptRide(rideId: string) {
    if (accepting || isBusy || activeRide || needsWallet) return;
    setAccepting(true);
    setError(null);
    try {
      const ride = await acceptRide(rideId, driverId, driverWalletAddress);
      rememberRide(ride);
      setWaitingRides((previous) => previous.filter((item) => item.id !== ride.id));
      onToast("Ride accepted", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept ride. It may no longer be available.";
      setError(message);
    } finally {
      setAccepting(false);
    }
  }

  async function handleCompleteRide(ride: RideBookingRow) {
    const updated = await onCompleteRide(ride);
    if (updated) rememberRide(updated);
  }

  function handleRejectRide(rideId: string) {
    setRejectedRideIds((previous) => [...previous, rideId]);
    onToast("Ride hidden from your queue", "info");
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Loading nearby rides...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(error || loadError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error || loadError}
        </div>
      )}
      {activeRide ? (
        <article className="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
              Current Accepted Ride
            </span>
            <span className="text-xs text-slate-500">
              {new Date(activeRide.created_at).toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-slate-800">
              <span className="text-slate-500">Pickup:</span>{" "}
              {activeRide.pickup_place_name || "Pickup location"}
            </p>
            <p className="text-slate-800">
              <span className="text-slate-500">Destination:</span>{" "}
              {activeRide.destination_place_name || "Destination location"}
            </p>
          </div>
          {!activeRide.driver_completed && (
            <button
              type="button"
              onClick={() => void handleCompleteRide(activeRide)}
              disabled={isBusy}
              className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Confirm completion
            </button>
          )}
          {activeRide.driver_completed && !activeRide.passenger_completed && (
            <p className="mt-3 text-xs text-amber-700">
              Waiting for passenger confirmation to finish the ride.
            </p>
          )}
        </article>
      ) : hasLocation ? (
        <>
          <div>
            <h2 className="text-xl font-bold text-slate-950">Available Nearby Rides</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review requests within {MAX_DISTANCE_KM} km, then accept or reject them.
            </p>
          </div>
          {rides.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">
                No nearby rides. New bookings will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => (
                <article
                  key={ride.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                      Waiting
                    </span>
                    <span className="text-sm font-semibold text-emerald-700">
                      {ride.distanceKm.toFixed(2)} km
                    </span>
                  </div>
                  <div className="mb-3 space-y-2 text-sm">
                    <p className="text-slate-800">
                      <span className="text-slate-500">Pickup:</span>{" "}
                      {ride.pickup_place_name || "Pickup location"}
                    </p>
                    <p className="text-slate-800">
                      <span className="text-slate-500">Destination:</span>{" "}
                      {ride.destination_place_name || "Destination location"}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => void handleAcceptRide(ride.id)}
                      disabled={isBusy || accepting || needsWallet}
                      className="rounded-lg bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {accepting ? "Accepting…" : "Accept"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRide(ride.id)}
                      disabled={Boolean(isBusy)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                  {needsWallet && (
                    <p className="mt-2 text-xs text-amber-700">Connect wallet before accepting rides</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      ) : null}
      {history.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Recent rides</h3>
          <ul className="mt-2 divide-y divide-slate-100 text-sm text-slate-600">
            {history.map((ride) => (
              <li key={ride.id} className="flex justify-between gap-3 py-2">
                <span>{ride.pickup_place_name ?? "Pickup"} → {ride.destination_place_name ?? "Destination"}</span>
                <span className="capitalize">{ride.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
