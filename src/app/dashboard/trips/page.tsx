"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import RideIcon from "@/components/RideIcon";
import { useWorkspaceRole, useWorkspaceUser } from "@/components/workspace/Workspace";
import { rideDeskPath } from "@/lib/ride-roles";
import { fetchRideActivity } from "@/lib/supabase/rideBookings";
import type { RideBookingRow } from "@/types";

const statusLabels: Record<RideBookingRow["status"], string> = {
  waiting: "Waiting for a driver",
  accepted: "Accepted",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function TripsPage() {
  const userId = useWorkspaceUser()?.id;
  const role = useWorkspaceRole();
  const [rides, setRides] = useState<RideBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "past">("all");

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setRides(await fetchRideActivity(userId));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visibleRides = rides.filter((ride) => {
    const active = ride.status === "waiting" || ride.status === "accepted";
    return filter === "all" || (filter === "active" ? active : !active);
  });

  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">RIDE ACTIVITY</p>
        <h1>My trips.</h1>
        <p>See current requests and past journeys as a passenger or driver.</p>
      </header>
      <section className="workspace-surface">
        <div className="trip-toolbar">
          <div className="trip-filters" aria-label="Filter trips">
            {(["all", "active", "past"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "all"
                  ? "All trips"
                  : value === "active"
                    ? "Active"
                    : "Past"}
              </button>
            ))}
          </div>
          <button
            className="trip-refresh"
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="trip-empty" role="status">
            Loading trips…
          </p>
        ) : error ? (
          <p className="trip-empty" role="alert">
            Couldn’t load trips. Select Refresh to try again.
          </p>
        ) : visibleRides.length === 0 ? (
          <div className="trip-empty">
            <span>
              <RideIcon name="route" />
            </span>
            <h2>
              {filter === "all"
                ? "Your trips will show up here."
                : "No trips in this view."}
            </h2>
            <p>Head to the ride desk to request or accept a ride.</p>
            <Link className="ride-button" href={role ? rideDeskPath(role) : "/dashboard"}>
              Go to ride desk <RideIcon name="arrow" />
            </Link>
          </div>
        ) : (
          <ul className="trip-list">
            {visibleRides.map((ride) => (
              <li key={ride.id} className="trip-row">
                <span className="workspace-action-icon">
                  <RideIcon name="car" />
                </span>
                <div>
                  <strong>
                    {ride.pickup_place_name || "Pickup"} →{" "}
                    {ride.destination_place_name || "Destination"}
                  </strong>
                  <small>
                    {ride.passenger_id === userId ? "Passenger" : "Driver"} ·{" "}
                    {new Date(ride.created_at).toLocaleDateString()}
                  </small>
                </div>
                <span className="trip-status" data-status={ride.status}>
                  {statusLabels[ride.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
