export type Coordinates = { lat: number; lng: number };

export function coordinates(lat: unknown, lng: unknown): Coordinates | null {
  return typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
    ? { lat, lng }
    : null;
}

export function parseCoordinates(value: string) {
  const parts = value.split(",").map((part) => part.trim());
  if (
    parts.length !== 2 ||
    parts.some((part) => !part || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))
  ) {
    return null;
  }

  const [lat, lng] = parts.map(Number);
  return coordinates(lat, lng);
}
