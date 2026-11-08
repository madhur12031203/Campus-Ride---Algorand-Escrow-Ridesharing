"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchMyRideBookings,
  subscribeToMyRideBookings,
} from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

type PassengerRideStatusProps = {
  passengerId: string;
  isBusy: boolean;
  onCompleteRide: (ride: RideBookingRow) => Promise<RideBookingRow | undefined>;
  latestRide: RideBookingRow | null;
  onActiveRideChange: (hasActiveRide: boolean) => void;
};

const ACTIVE_STATUSES: RideBookingRow["status"][] = ["waiting", "accepted"];

function mergeRideUpdate(rides: RideBookingRow[], update: RideBookingRow) {
  const current = rides.find((ride) => ride.id === update.id);
  if (!current) return [update, ...rides];
  // A request response can arrive after a newer realtime update for the same ride.
  if (!ACTIVE_STATUSES.includes(current.status) || (current.status === "accepted" && update.status === "waiting")) {
    return rides;
  }
  return rides.map((ride) =>
    ride.id === update.id
      ? {
          ...update,
          passenger_completed: ride.passenger_completed || update.passenger_completed,
          driver_completed: ride.driver_completed || update.driver_completed,
        }
      : ride,
  );
}

function StatusBadge({ status }: { status: RideBookingRow["status"] }) {
  const colors = {
    waiting: "bg-amber-100 text-amber-800",
    accepted: "bg-emerald-100 text-emerald-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}

export default function PassengerRideStatus({
  passengerId,
  isBusy,
  onCompleteRide,
  latestRide,
  onActiveRideChange,
}: PassengerRideStatusProps) {
  const [rides, setRides] = useState<RideBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const refresh = () => {
      void fetchMyRideBookings(passengerId)
        .then((data) => {
          if (active) {
            setError(null);
            setRides((previous) => data.reduce(mergeRideUpdate, previous));
          }
        })
        .catch(() => {
          if (active) setError("Could not load your rides. Refresh to try again.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    const unsubscribe = subscribeToMyRideBookings(
      passengerId,
      (ride) => {
        if (active) setRides((previous) => mergeRideUpdate(previous, ride));
      },
      refresh,
    );
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      unsubscribe();
      window.removeEventListener("focus", refresh);
    };
  }, [passengerId]);

  useEffect(() => {
    if (latestRide?.passenger_id === passengerId) {
      setRides((previous) => mergeRideUpdate(previous, latestRide));
    }
  }, [latestRide, passengerId]);

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
    if (!loading && !error) onActiveRideChange(Boolean(activeRide));
  }, [activeRide, error, loading, onActiveRideChange]);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Loading your rides...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (rides.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-800">
        {activeRide ? "Current Active Ride" : "Ride History"}
      </h3>
      {activeRide ? (
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <StatusBadge status={activeRide.status} />
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
          {activeRide.status === "accepted" && !activeRide.passenger_completed && (
              <button
                type="button"
                onClick={() => void onCompleteRide(activeRide)}
                disabled={isBusy}
                className="mt-3 w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirm completion
              </button>
            )}
          {activeRide.status === "accepted" &&
            activeRide.passenger_completed &&
            !activeRide.driver_completed && (
              <p className="mt-3 text-xs text-amber-700">
                Waiting for driver confirmation to finish the ride.
              </p>
            )}
        </article>
      ) : (
        historyRides.map((ride) => (
          <article
            key={ride.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-2 flex items-center justify-between">
              <StatusBadge status={ride.status} />
              <span className="text-xs text-slate-500">
                {new Date(ride.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-800">
              {ride.pickup_place_name || "Pickup location"} to{" "}
              {ride.destination_place_name || "Destination location"}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
