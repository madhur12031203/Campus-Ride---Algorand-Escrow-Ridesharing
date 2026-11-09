import type { Coordinates } from "./coordinates";
import type { RideRouteLeg } from "./ride-map";

const waypoint = ({ lat, lng }: Coordinates) => ({
  location: { latLng: { latitude: lat, longitude: lng } },
});

export async function getRideRoute(
  apiKey: string,
  pickup: Coordinates,
  dropoff: Coordinates,
  driver: Coordinates | null,
): Promise<RideRouteLeg[]> {
  const hasPickupLeg =
    driver !== null && (driver.lat !== pickup.lat || driver.lng !== pickup.lng);
  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "routes.legs.distanceMeters,routes.legs.duration,routes.legs.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: waypoint(hasPickupLeg ? driver : pickup),
        destination: waypoint(dropoff),
        ...(hasPickupLeg ? { intermediates: [waypoint(pickup)] } : {}),
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error("Road directions are unavailable.");
  const body = await response.json();
  const legs = body.routes?.[0]?.legs;
  if (!Array.isArray(legs) || legs.length !== (hasPickupLeg ? 2 : 1)) {
    throw new Error("No road route was found for these stops.");
  }
  return legs.map((leg, index) => {
    const polyline = leg?.polyline?.encodedPolyline;
    const distanceMeters = leg?.distanceMeters;
    const duration =
      typeof leg?.duration === "string" &&
      leg.duration.match(/^(\d+(?:\.\d+)?)s$/);
    if (
      typeof polyline !== "string" ||
      !polyline ||
      typeof distanceMeters !== "number" ||
      !Number.isFinite(distanceMeters) ||
      distanceMeters < 0 ||
      !duration
    ) {
      throw new Error("Road directions returned incomplete route details.");
    }
    return {
      kind: hasPickupLeg && index === 0 ? "toPickup" : "toDestination",
      polyline,
      distanceMeters,
      durationSeconds: Number(duration[1]),
    };
  });
}
