"use client";

export type DemoUser = {
  id: string;
  email: string;
  name: string;
  role: "driver" | "passenger";
  wallet_address?: string | null;
  rating_avg: number;
  rating_count: number;
};

const DEMO_STORAGE_KEY = "campus_ride_demo_session";

export function getDemoUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function setDemoUser(user: DemoUser): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Storage quota or privacy mode error
  }
}

export function clearDemoUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function createDemoSession(
  role: "driver" | "passenger",
  email?: string,
  name?: string
): DemoUser {
  const isDriver = role === "driver";
  const user: DemoUser = {
    id: isDriver ? "demo-driver-77" : "demo-passenger-99",
    email: email?.trim() || (isDriver ? "driver.demo@campusride.edu" : "passenger.demo@campusride.edu"),
    name: name?.trim() || (isDriver ? "Alex Rivera (Campus Driver)" : "Sam Chen (Campus Passenger)"),
    role,
    wallet_address: null,
    rating_avg: isDriver ? 4.95 : 5.0,
    rating_count: isDriver ? 42 : 12,
  };
  setDemoUser(user);
  return user;
}
