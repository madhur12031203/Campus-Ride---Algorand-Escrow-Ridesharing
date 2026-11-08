"use client";

/**
 * Core Realtime Ride-Sharing Panel
 * Passenger: Book Ride (lat/lng) → insert into ride_bookings
 * Driver: Realtime list of nearby rides (≤8 km), no refresh
 */

import { useCallback, useState } from "react";
import BookRideForm from "./BookRideForm";
import DriverRealtimeView from "./DriverRealtimeView";
import PassengerRideStatus from "./PassengerRideStatus";

import {
  createRideBooking,

  markDriverCompleted,
  markPassengerCompleted,
} from "@/lib/supabase/rideBookings";
import { ESCROW_PAYMENTS_ENABLED } from "@/lib/algorand/escrow";

import ToastStack from "@/components/ui/ToastStack";
import type { RideBookingRow, UserRole } from "@/types";

type CoreRideSharePanelProps = {
  accountId: string;
  role: UserRole;
  walletAddress?: string | null;
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.length > 0) {
      return maybeMessage;
    }
  }
  return fallback;
}

type Toast = {
  id: number;
  message: string;
  tone?: "success" | "info" | "error";
};

export default function CoreRideSharePanel({
  accountId,
  role,
  walletAddress,
}: CoreRideSharePanelProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRideUpdate, setLastRideUpdate] = useState<RideBookingRow | null>(null);
  const [passengerHasActiveRide, setPassengerHasActiveRide] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  const handleBookRide = useCallback(
    async (input: {
      originLat: number;
      originLng: number;
      destinationLat: number;
      destinationLng: number;
      pickupPlaceName?: string | null;
      destinationPlaceName?: string | null;
    }) => {
      if (ESCROW_PAYMENTS_ENABLED && !walletAddress) {
        throw new Error("Connect wallet before booking a ride");
      }
      setIsBusy(true);
      setError(null);
      try {
        const booking = await createRideBooking({
          passengerId: accountId,
          passengerWallet: walletAddress ?? null,
          ...input,
        });
        setPassengerHasActiveRide(true);
        setLastRideUpdate(booking);
        pushToast("Ride requested", "success");
      } catch (err) {
        setError(getErrorMessage(err, "Failed to book ride"));
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [accountId, pushToast, walletAddress]
  );

  const handleComplete = useCallback(
    async (ride: RideBookingRow) => {
      setIsBusy(true);
      setError(null);
      try {
        const confirm = role === "driver" ? markDriverCompleted : markPassengerCompleted;
        const updated = await confirm(ride.id, accountId);
        if (role === "passenger") {
          setLastRideUpdate(updated);
        }
        if (updated.status === "completed") {
          pushToast("Ride completed", "success");
        } else {
          pushToast("Your confirmation was saved. Waiting for the other person.", "info");
        }
        return updated;
      } catch (err) {
        setError(getErrorMessage(err, "Failed to complete ride"));
      } finally {
        setIsBusy(false);
      }
    },
    [accountId, pushToast, role]
  );

  return (
    <section className="space-y-4">
      <ToastStack toasts={toasts} />
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {role === "passenger" ? (
        <div className="space-y-6">
          <BookRideForm
            onBookRide={handleBookRide}
            isBusy={isBusy}
            hasActiveRide={passengerHasActiveRide}
            activeRideMessage="You already have an active ride"
            walletRequired={ESCROW_PAYMENTS_ENABLED && !walletAddress}
          />
          <PassengerRideStatus
            key={accountId}
            passengerId={accountId}
            latestRide={lastRideUpdate}
            onActiveRideChange={setPassengerHasActiveRide}
            isBusy={isBusy}
            onCompleteRide={handleComplete}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase text-sky-700">Driver dashboard</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Accept nearby requests</h3>
            <p className="mt-1 text-sm text-slate-600">
              Set your current location to see passenger bookings within 8 km.
            </p>
          </div>
          <DriverRealtimeView
            driverId={accountId}
            isBusy={isBusy}
            onCompleteRide={handleComplete}
            driverWalletAddress={walletAddress ?? null}
            onToast={pushToast}
          />
        </div>
      )}
    </section>
  );
}
