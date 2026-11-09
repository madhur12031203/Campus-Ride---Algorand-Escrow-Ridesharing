"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RideIcon from "@/components/RideIcon";
import { coordinates, type Coordinates } from "@/lib/coordinates";
import { googleRideDirections, type RideRouteLeg } from "@/lib/ride-map";
import type { RideBookingRow } from "@/types";
import GoogleRideMap, {
  dropoffLegColor,
  pickupLegColor,
  type RideMapPoint,
} from "./GoogleRideMap";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const noLegs: RideRouteLeg[] = [];

function legDescription(leg: RideRouteLeg | undefined) {
  if (!leg) return "Distance and ETA unavailable";
  return `${(leg.distanceMeters / 1000).toFixed(1)} km · ${Math.max(1, Math.round(leg.durationSeconds / 60))} min`;
}

export default function AcceptedRideMap({
  ride,
  driverPosition,
}: {
  ride: RideBookingRow;
  driverPosition?: Coordinates | null;
}) {
  const pickup = coordinates(ride.origin_lat, ride.origin_lng);
  const dropoff = coordinates(ride.destination_lat, ride.destination_lng);
  const driver = ride.driver_completed
    ? null
    : (driverPosition ?? coordinates(ride.driver_lat, ride.driver_lng));
  const driverAvailable = driver !== null;
  const [legs, setLegs] = useState<RideRouteLeg[]>(noLegs);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routing, setRouting] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const localDriver = useRef(driverPosition);

  useEffect(() => {
    localDriver.current = driverPosition;
  }, [driverPosition]);

  useEffect(() => {
    if (!apiKey || ride.status !== "accepted") return;
    const abort = new AbortController();
    setRouting(true);
    setRouteError(null);
    setLegs(noLegs);
    void fetch("/api/ride-route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rideId: ride.id,
        driverPosition: localDriver.current,
      }),
      signal: abort.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(data?.legs)) {
          throw new Error(data?.error || "Road directions are unavailable.");
        }
        if (!abort.signal.aborted) setLegs(data.legs);
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted) {
          setRouteError(
            error instanceof Error
              ? error.message
              : "Road directions are unavailable.",
          );
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setRouting(false);
      });
    return () => abort.abort();
  }, [ride.id, ride.status, driverAvailable, refreshCount]);

  const points = useMemo<RideMapPoint[]>(() => {
    const result: RideMapPoint[] = [];
    const driverPoint = coordinates(driver?.lat, driver?.lng);
    const pickupPoint = coordinates(ride.origin_lat, ride.origin_lng);
    const dropoffPoint = coordinates(
      ride.destination_lat,
      ride.destination_lng,
    );
    if (driverPoint)
      result.push({
        key: "driver",
        label: "Driver",
        point: driverPoint,
        color: pickupLegColor,
        glyph: "D",
      });
    if (pickupPoint)
      result.push({
        key: "pickup",
        label: "Pickup",
        point: pickupPoint,
        color: "#344456",
        glyph: "1",
      });
    if (dropoffPoint)
      result.push({
        key: "dropoff",
        label: "Drop-off",
        point: dropoffPoint,
        color: dropoffLegColor,
        glyph: "2",
      });
    return result;
  }, [
    driver?.lat,
    driver?.lng,
    ride.origin_lat,
    ride.origin_lng,
    ride.destination_lat,
    ride.destination_lng,
  ]);

  if (!pickup || !dropoff) {
    return (
      <p className="mt-3 text-sm text-slate-700">
        This ride doesn’t have valid pickup and drop-off coordinates.
      </p>
    );
  }

  const toPickup = legs.find((leg) => leg.kind === "toPickup");
  const toDropoff = legs.find((leg) => leg.kind === "toDestination");
  const atPickup = driver?.lat === pickup.lat && driver?.lng === pickup.lng;

  return (
    <section className="accepted-ride-map" aria-label="Accepted ride route">
      <div className="ride-map-heading">
        <span className="workspace-action-icon">
          <RideIcon name="route" />
        </span>
        <div>
          <h3>Ride route</h3>
          <p>
            {ride.driver_completed
              ? "The driver has confirmed completion."
              : driverAvailable
                ? "Driver → pickup → drop-off"
                : "Pickup → drop-off. Driver location has not been shared yet."}
          </p>
        </div>
      </div>
      {apiKey ? (
        <GoogleRideMap
          apiKey={apiKey}
          pickup={pickup}
          points={points}
          legs={legs}
        />
      ) : (
        <p className="ride-map-note">
          The in-app map isn’t set up yet. Open Google Maps below for the road
          route.
        </p>
      )}
      <div className="ride-map-legs">
        {!ride.driver_completed && (
          <div>
            <span className="ride-map-line ride-map-line-pickup" />
            <div>
              <strong>Driver → Pickup</strong>
              <small>
                {!driverAvailable
                  ? "Waiting for driver location"
                  : atPickup
                    ? "Driver is at pickup"
                    : routing
                      ? "Finding route…"
                      : legDescription(toPickup)}
              </small>
            </div>
          </div>
        )}
        <div>
          <span className="ride-map-line ride-map-line-dropoff" />
          <div>
            <strong>Pickup → Drop-off</strong>
            <small>
              {routing ? "Finding route…" : legDescription(toDropoff)}
            </small>
          </div>
        </div>
      </div>
      {ride.driver_location_at && driverAvailable && (
        <p className="ride-map-note">
          Driver location last shared at{" "}
          {new Date(ride.driver_location_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          })}
          .
        </p>
      )}
      {apiKey && driverAvailable && !routeError && (
        <p className="ride-map-note">
          The driver pin follows shared updates. Refresh the route for new
          directions from that position.
        </p>
      )}
      {routeError && (
        <p className="ride-map-note" role="status">
          {routeError}
        </p>
      )}
      <div className="ride-map-actions">
        <a
          className="ride-button"
          href={googleRideDirections(pickup, dropoff, driver)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Google Maps <RideIcon name="arrow" />
        </a>
        {apiKey && (
          <button
            className="ride-button ride-button-outline"
            type="button"
            disabled={routing}
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            Refresh route
          </button>
        )}
      </div>
    </section>
  );
}
