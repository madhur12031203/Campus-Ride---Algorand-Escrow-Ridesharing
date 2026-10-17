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
  markEscrowReleased,
  markDriverCompleted,
  markPassengerCompleted,
} from "@/lib/supabase/rideBookings";
import { releaseEscrowPayment } from "@/lib/algorand/escrow";
import { ensureUserProfile, updateRole, updateWalletAddress } from "@/lib/supabase/rideshare";
import ToastStack from "@/components/ui/ToastStack";
import type { RideBookingRow, UserProfileRow, UserRole } from "@/types";

type CoreRideSharePanelProps = {
  walletAddress: string | null;
  appAddress: string;
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
  appAddress,
}: CoreRideSharePanelProps) {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRoleSaving, setIsRoleSaving] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null);
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
    setIsProfileLoading(true);
    const next = await ensureUserProfile(walletAddress);
    setProfile(next);
    if (next?.role === "passenger") {
      const activeRide = await fetchPassengerActiveRide(next.id);
      setPassengerHasActiveRide(Boolean(activeRide));
    } else {
      setPassengerHasActiveRide(false);
    }
    setIsProfileLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    void refreshProfile().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setIsProfileLoading(false);
    });
  }, [refreshProfile, walletAddress]);

  useEffect(() => {
    if (!profile?.id) return;
    void updateWalletAddress(profile.id, walletAddress ?? null).catch(() => undefined);
  }, [profile?.id, walletAddress]);

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
      if (!walletAddress) {
        throw new Error("Connect wallet before booking a ride");
      }
      setIsBusy(true);
      setError(null);
      try {
        await createRideBooking({
          passengerId: profile.id,
          passengerWallet: walletAddress,
          ...input,
        });
        setPassengerHasActiveRide(true);
        pushToast("Ride booked", "success");
        await refreshProfile();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to book ride");
        throw err;
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id, pushToast, refreshProfile, walletAddress]
  );

  const releasePayment = useCallback(
    async (ride: RideBookingRow) => {
      if (!appAddress) {
        throw new Error("Escrow app address is not configured");
      }
      if (!ride.driver_wallet) {
        throw new Error("Driver wallet missing for escrow release");
      }

      const releaseTxnId = await releaseEscrowPayment({
        appAddress,
        driverAddress: ride.driver_wallet,
        rideId: ride.id,
      });
      await markEscrowReleased(ride.id, releaseTxnId);
      setPaymentMessage("Payment released successfully");
      pushToast("Payment released", "success");
    },
    [appAddress, pushToast]
  );

  const handlePassengerComplete = useCallback(
    async (ride: RideBookingRow) => {
      if (!profile?.id) return;
      setIsBusy(true);
      setError(null);
      setPaymentMessage(null);
      try {
        const result = await markPassengerCompleted(ride.id, profile.id);
        pushToast("Ride completed", "success");
        if (result.shouldReleasePayment) {
          try {
            await releasePayment(result.ride);
          } catch (releaseError) {
            setError(
              `Ride marked completed, but payment release failed: ${getErrorMessage(
                releaseError,
                "Unknown payment error"
              )}`
            );
          }
          setPassengerHasActiveRide(false);
        }
        await refreshProfile();
      } catch (err) {
        setError(getErrorMessage(err, "Failed to complete ride"));
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id, pushToast, refreshProfile, releasePayment]
  );

  const handleDriverComplete = useCallback(
    async (ride: RideBookingRow) => {
      if (!profile?.id) return;
      setIsBusy(true);
      setError(null);
      setPaymentMessage(null);
      try {
        const result = await markDriverCompleted(ride.id, profile.id);
        pushToast("Ride completed", "success");
        if (result.shouldReleasePayment) {
          try {
            await releasePayment(result.ride);
          } catch (releaseError) {
            setError(
              `Ride marked completed, but payment release failed: ${getErrorMessage(
                releaseError,
                "Unknown payment error"
              )}`
            );
          }
        }
        await refreshProfile();
      } catch (err) {
        setError(getErrorMessage(err, "Failed to complete ride"));
      } finally {
        setIsBusy(false);
      }
    },
    [profile?.id, pushToast, refreshProfile, releasePayment]
  );

  if (isProfileLoading) {
    return (
      <section className="cyber-glass rounded-2xl p-8 text-center border border-white/10">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mb-3" />
        <p className="text-xs font-mono text-slate-400">Synchronizing campus profile & Algorand state...</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="cyber-glass rounded-2xl p-6 text-center border border-amber-500/30 bg-amber-950/20">
        <p className="text-sm font-semibold text-amber-300">
          Account sync failed. Please refresh the page or re-authenticate.
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
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 px-4 py-3 text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Role switcher header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Active Mode: <span className="font-bold text-white capitalize">{role}</span>
          </p>
        </div>
        <div className="flex items-center rounded-xl bg-slate-900/80 p-1 border border-white/10">
          <button
            type="button"
            disabled={isRoleSaving || role === "passenger"}
            onClick={() => void handlePickRole("passenger")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              role === "passenger"
                ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Passenger
          </button>
          <button
            type="button"
            disabled={isRoleSaving || role === "driver"}
            onClick={() => void handlePickRole("driver")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              role === "driver"
                ? "bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Driver
          </button>
        </div>
      </div>

      {role === "passenger" ? (
        <div className="space-y-5">
          <BookRideForm
            onBookRide={handleBookRide}
            isBusy={isBusy}
            hasActiveRide={passengerHasActiveRide}
            activeRideMessage="You currently have an active ride request."
            walletConnected={Boolean(walletAddress)}
          />
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3.5 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <span>🛡️</span>
            <span>
              All trip fares are held securely in an Algorand smart contract escrow and released only upon ride completion.
            </span>
          </div>
          <PassengerRideStatus
            passengerId={profile.id}
            isBusy={isBusy}
            onCompleteRide={handlePassengerComplete}
            paymentMessage={paymentMessage}
            walletAddress={walletAddress}
            appAddress={appAddress}
            onToast={pushToast}
          />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Driver Terminal</p>
            <h3 className="mt-0.5 text-base font-bold text-white">Live Campus Ride Radar</h3>
            <p className="mt-1 text-xs text-slate-400">
              Broadcast your availability to detect passenger requests within an 8 km campus radius.
            </p>
          </div>
          <DriverRealtimeView
            isBusy={isBusy}
            onCompleteRide={handleDriverComplete}
            paymentMessage={paymentMessage}
            driverWalletAddress={walletAddress}
            onToast={pushToast}
          />
        </div>
      )}
    </section>
  );
}
