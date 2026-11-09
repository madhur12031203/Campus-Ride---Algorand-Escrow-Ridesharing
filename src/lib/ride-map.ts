import type { Coordinates } from "./coordinates";

export type RideRouteLeg = {
  kind: "toPickup" | "toDestination";
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
};

export function googleRideDirections(
  pickup: Coordinates,
  dropoff: Coordinates,
  driver?: Coordinates | null,
) {
  const format = (point: Coordinates) => `${point.lat},${point.lng}`;
  const query = new URLSearchParams({
    api: "1",
    origin: format(driver ?? pickup),
    destination: format(dropoff),
    travelmode: "driving",
  });
  if (driver && (driver.lat !== pickup.lat || driver.lng !== pickup.lng)) {
    query.set("waypoints", format(pickup));
  }
  return `https://www.google.com/maps/dir/?${query}`;
}
