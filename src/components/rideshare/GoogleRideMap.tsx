"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import type { Coordinates } from "@/lib/coordinates";
import type { RideRouteLeg } from "@/lib/ride-map";

export type RideMapPoint = {
  key: "driver" | "pickup" | "dropoff";
  label: string;
  point: Coordinates;
  color: string;
  glyph: string;
};

export const pickupLegColor = "#2563eb";
export const dropoffLegColor = "#08765a";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

let mapsReady: Promise<void> | undefined;
let authenticationFailed = false;
const authenticationFailureListeners = new Set<() => void>();

function loadGoogleMaps(apiKey: string) {
  if (!mapsReady) {
    const previousHandler = window.gm_authFailure;
    window.gm_authFailure = () => {
      authenticationFailed = true;
      authenticationFailureListeners.forEach((notify) => notify());
      previousHandler?.();
    };
    setOptions({ key: apiKey, v: "weekly" });
    mapsReady = Promise.all([
      importLibrary("maps"),
      importLibrary("marker"),
      importLibrary("geometry"),
      importLibrary("core"),
    ]).then(() => undefined);
  }
  return mapsReady;
}

export default function GoogleRideMap({
  apiKey,
  pickup,
  points,
  legs,
}: {
  apiKey: string;
  pickup: Coordinates;
  points: RideMapPoint[];
  legs: RideRouteLeg[];
}) {
  const target = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const pickupLat = pickup.lat;
  const pickupLng = pickup.lng;
  const hasDriver = points.some(({ key }) => key === "driver");
  const pointsRef = useRef(points);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    let cancelled = false;
    let instance: google.maps.Map | undefined;
    const element = target.current;
    if (!element) return;

    const showAuthenticationError = () => {
      setMap(null);
      setMapError(
        "Google Maps could not verify this site. Open the route in Google Maps below.",
      );
    };
    if (authenticationFailed) {
      showAuthenticationError();
      return;
    }
    authenticationFailureListeners.add(showAuthenticationError);

    void loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || authenticationFailed) return;
        instance = new google.maps.Map(element, {
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
          center: { lat: pickupLat, lng: pickupLng },
          zoom: 13,
          gestureHandling: "cooperative",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        if (!authenticationFailed) setMap(instance);
      })
      .catch(() => {
        if (!cancelled && !authenticationFailed) {
          setMap(null);
          setMapError("Couldn’t load the map. Open the route in Google Maps below.");
        }
      });
    return () => {
      cancelled = true;
      authenticationFailureListeners.delete(showAuthenticationError);
      if (instance) google.maps.event.clearInstanceListeners(instance);
      element.replaceChildren();
    };
  }, [apiKey, pickupLat, pickupLng]);

  useEffect(() => {
    if (!map) return;
    const markers = points.map(({ label, point, color, glyph, key }) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: point,
        title: label,
        zIndex: key === "pickup" ? 3 : key === "dropoff" ? 2 : 1,
      });
      const pin = new google.maps.marker.PinElement({
        background: color,
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        glyphText: glyph,
      });
      marker.append(pin);
      return marker;
    });
    return () => {
      markers.forEach((marker) => {
        marker.map = null;
      });
    };
  }, [map, points]);

  useEffect(() => {
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    pointsRef.current.forEach(({ point }) => bounds.extend(point));
    const lines: google.maps.Polyline[] = [];
    for (const leg of legs) {
      const path = google.maps.geometry.encoding.decodePath(leg.polyline);
      path.forEach((point) => bounds.extend(point));
      lines.push(
        new google.maps.Polyline({
          map,
          path,
          strokeColor:
            leg.kind === "toPickup" ? pickupLegColor : dropoffLegColor,
          strokeOpacity: 0.95,
          strokeWeight: 5,
        }),
      );
    }
    if (!bounds.isEmpty()) {
      const southwest = bounds.getSouthWest();
      const northeast = bounds.getNorthEast();
      if (southwest.equals(northeast)) {
        map.setCenter(southwest);
        map.setZoom(15);
      } else {
        map.fitBounds(bounds, 44);
      }
    }
    return () => {
      lines.forEach((line) => line.setMap(null));
    };
  }, [map, legs, hasDriver]);

  return (
    <div className="ride-map-canvas">
      <div
        ref={target}
        className="ride-map-google"
        hidden={Boolean(mapError)}
        role="region"
        aria-label="Map of the driver location, pickup, and drop-off"
      />
      {!map && (
        <p className="ride-map-placeholder" role="status">
          {mapError ?? "Loading map…"}
        </p>
      )}
    </div>
  );
}
