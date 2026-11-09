"use client";

import { useEffect, useState } from "react";
import { coordinates, type Coordinates } from "@/lib/coordinates";
import { updateRideDriverLocation } from "@/lib/supabase/rideBookings";

const SHARE_INTERVAL_MS = 15_000;

export default function DriverLocationControls({
  rideId,
  driverId,
  onLocation,
  disabled,
}: {
  rideId: string;
  driverId: string;
  onLocation: (rideId: string, point: Coordinates) => void;
  disabled?: boolean;
}) {
  const [sharing, setSharing] = useState(false);
  const [firstUpdate, setFirstUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sharing || !navigator.geolocation) return;
    let active = true;
    let inFlight = false;
    let lastUpdate = 0;
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!active || inFlight || Date.now() - lastUpdate < SHARE_INTERVAL_MS)
          return;
        const point = coordinates(
          position.coords.latitude,
          position.coords.longitude,
        );
        if (!point) return;
        lastUpdate = Date.now();
        inFlight = true;
        void updateRideDriverLocation(rideId, driverId, point)
          .then(() => {
            if (!active) return;
            onLocation(rideId, point);
            setFirstUpdate(true);
            setError(null);
          })
          .catch(() => {
            if (!active) return;
            setError(
              "Couldn’t share your location. Check your connection and try again.",
            );
            setSharing(false);
          })
          .finally(() => {
            inFlight = false;
          });
      },
      (failure) => {
        if (!active) return;
        setError(
          failure.code === 1
            ? "Location permission was denied."
            : "GPS location is unavailable right now.",
        );
        setSharing(false);
      },
      { enableHighAccuracy: false, maximumAge: 5000, timeout: 15_000 },
    );
    return () => {
      active = false;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [sharing, rideId, driverId, onLocation]);

  function toggleSharing() {
    if (sharing) {
      setSharing(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("This browser doesn’t support GPS location.");
      return;
    }
    setError(null);
    setFirstUpdate(false);
    setSharing(true);
  }

  return (
    <div className="ride-location-share">
      <button
        type="button"
        className="ride-button ride-button-outline"
        disabled={disabled}
        onClick={toggleSharing}
      >
        {sharing ? "Stop live sharing" : "Share live location"}
      </button>
      <p role="status">
        {sharing
          ? firstUpdate
            ? "Sharing GPS while this tab is open."
            : "Waiting for your GPS location…"
          : "The passenger can see the last shared location until you finish the ride."}
      </p>
      {error && (
        <p className="text-rose-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
