import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { coordinates } from "@/lib/coordinates";
import { getRideRoute } from "@/lib/googleRideRoute";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { RideBookingRow } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (
      typeof body?.rideId !== "string" ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(body.rideId)
    ) {
      return NextResponse.json({ error: "Invalid ride ID." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabasePublishableKey(),
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (items) => {
            for (const { name, value, options } of items)
              cookieStore.set(name, value, options);
          },
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in to view this route." },
        { status: 401 },
      );

    const { data, error } = await supabase
      .from("ride_bookings")
      .select("*")
      .eq("id", body.rideId)
      .eq("status", "accepted")
      .maybeSingle();
    if (error)
      return NextResponse.json(
        { error: "Couldn’t load this ride." },
        { status: 503 },
      );
    const ride = data as RideBookingRow | null;
    if (
      !ride ||
      (ride.driver_id !== user.id && ride.passenger_id !== user.id)
    ) {
      return NextResponse.json(
        { error: "Ride route not found." },
        { status: 404 },
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        {
          error:
            "Road directions aren’t configured for this site. Open the route in Google Maps.",
        },
        { status: 503 },
      );

    const pickup = coordinates(ride.origin_lat, ride.origin_lng);
    const dropoff = coordinates(ride.destination_lat, ride.destination_lng);
    if (!pickup || !dropoff) {
      return NextResponse.json(
        { error: "This ride is missing valid stops." },
        { status: 422 },
      );
    }

    const localDriver =
      ride.driver_id === user.id
        ? coordinates(body.driverPosition?.lat, body.driverPosition?.lng)
        : null;
    const driver = ride.driver_completed
      ? null
      : (localDriver ?? coordinates(ride.driver_lat, ride.driver_lng));
    const legs = await getRideRoute(apiKey, pickup, dropoff, driver);
    return NextResponse.json(
      { legs },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Couldn’t load road directions. Try opening the route in Google Maps.",
      },
      { status: 502 },
    );
  }
}
