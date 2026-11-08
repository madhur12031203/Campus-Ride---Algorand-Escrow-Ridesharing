import type { UserRole } from "@/types";

export function parseRideRole(value: unknown): UserRole | null {
  return value === "driver" || value === "passenger" ? value : null;
}

export function rideDeskPath(role: UserRole) {
  return role === "driver" ? "/dashboard/driver" : "/dashboard/passenger";
}

export function rideDeskLabel(role: UserRole) {
  return role === "driver" ? "Ride requests" : "Book a ride";
}

export function rideDeskRedirect(pathname: string, role: UserRole) {
  const desk = rideDeskPath(role);
  const isDesk = pathname === "/dashboard/driver" || pathname === "/dashboard/passenger";
  return pathname === "/dashboard/book" || (isDesk && pathname !== desk) ? desk : null;
}
