"use client";

/**
 * Core Realtime Ride-Sharing Panel
 * Passenger: Book Ride (lat/lng) → insert into ride_bookings
 * Driver: Realtime list of nearby rides (≤8 km), no refresh
 */

import { useCallback, useEffect, useState } from "react";
import BookRideForm from "./BookRideForm";
import DriverRealtimeView from "./DriverRealtimeView";
import PassengerRideStatus from "./PassengerRideStatus";
import RoleSelector from "./RoleSelector";
import {
  createRideBooking,
  fetchPassengerActiveRide,
  markDriverCompleted,
  markPassengerCompleted,
} from "@/lib/supabase/rideBookings";
import { ESCROW_PAYMENTS_ENABLED } from "@/lib/algorand/escrow";
import { ensureUserProfile, updateRole } from "@/lib/supabase/rideshare";
import ToastStack from "@/components/ui/ToastStack";
import type { RideBookingRow, UserProfileRow, UserRole } from "@/types";

type CoreRideSharePanelProps = {
  walletAddress: string | null;
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
  walletAddress,
}: CoreRideSharePanelProps) {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [lastRideUpdate, setLastRideUpdate] = useState<RideBookingRow | null>(null);
  const [passengerHasActiveRide, setPassengerHasActiveRide] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const role = profile?.role ?? null;

  const pushToast = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  }, []);

  const refreshProfile = useCallback(async () => {
    const next = await ensureUserProfile(walletAddress);
    setProfile(next);
    if (next?.role === "passenger") {
      const activeRide = await fetchPassengerActiveRide(next.id);
      setPassengerHasActiveRide(Boolean(activeRide));
    } else {
      setPassengerHasActiveRide(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    setIsProfileLoading(true);
    setError(null);
    void refreshProfile()
      .catch((err: unknown) => setError(getErrorMessage(err, "Failed to load profile")))
      .finally(() => setIsProfileLoading(false));
  }, [refreshProfile]);

  const handlePickRole = useCallback(
    async (nextRole: UserRole) => {
      if (!profile) return;
      setIsRoleSaving(true);
      setError(null);
      try {
        const nextProfile = await updateRole(profile.id, nextRole);
        setProfile(nextProfile);
        if (nextProfile.role === "passenger") {
          const activeRide = await fetchPassengerActiveRide(nextProfile.id);
          setPassengerHasActiveRide(Boolean(activeRide));
        } else {
          setPassengerHasActiveRide(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save role");
      } finally {
        setIsRoleSaving(false);
      }
    },
    [profile]
  );

  const handleBookRide = useCallback(
    async (input: {
      originLat: number;
      originLng: number;
      destinationLat: number;
      destinationLng: number;
      pickupPlaceName?: string | null;
      destinationPlaceName?: string | null;
    }) => {
      if (!profile?.id) return;
      if (ESCROW_PAYMENTS_ENABLED && !walletAddress) {
        throw new Error("Connect wallet before booking a ride");
      }
      setIsBusy(true);
      setError(null);
      try {
        const booking = await createRideBooking({
          passengerId: profile.id,
          passengerWallet: walletAddress,
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
    [profile?.id, pushToast, walletAddress]
  );

  const handleComplete = useCallback(
    async (ride: RideBookingRow) => {
      if (!profile?.id || !role) return;
      setIsBusy(true);
      setError(null);
      try {
        const confirm = role === "driver" ? markDriverCompleted : markPassengerCompleted;
        const updated = await confirm(ride.id, profile.id);
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
    [profile?.id, pushToast, role]
  );

  if (isProfileLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Loading your ride profile...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-800">
          {error || "We could not load your account. Refresh the page or sign in again."}
        </p>
      </section>
    );
  }

  if (!role) {
    return <RoleSelector onPickRole={handlePickRole} isSaving={isRoleSaving} />;
  }

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
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-700">Passenger dashboard</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950">Request a campus ride</h3>
            <p className="mt-1 text-sm text-slate-600">
              Add pickup and drop locations, then nearby drivers can accept your request.
            </p>
          </div>
          <BookRideForm
            onBookRide={handleBookRide}
            isBusy={isBusy}
            hasActiveRide={passengerHasActiveRide}
            activeRideMessage="You already have an active ride"
            walletRequired={ESCROW_PAYMENTS_ENABLED && !walletAddress}
          />
          <PassengerRideStatus
            key={profile.id}
            passengerId={profile.id}
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
            driverId={profile.id}
            isBusy={isBusy}
            onCompleteRide={handleComplete}
            driverWalletAddress={walletAddress}
            onToast={pushToast}
          />
        </div>
      )}
    </section>
  );
}
