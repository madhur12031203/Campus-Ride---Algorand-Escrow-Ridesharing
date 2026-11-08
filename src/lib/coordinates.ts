export function parseCoordinates(value: string) {
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length !== 2 || parts.some((part) => !part || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(part))) {
    return null;
  }

  const [lat, lng] = parts.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }

  return { lat, lng };
}
