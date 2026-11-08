"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RatingStars from "@/components/ui/RatingStars";
import VerificationSection from "@/components/verification/VerificationSection";
import { useWorkspaceUser } from "@/components/workspace/Workspace";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/rideshare";
import type { UserProfileRow } from "@/types";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  from_user: { name: string | null } | { name: string | null }[] | null;
};

export default function ProfilePage() {
  const user = useWorkspaceUser();
  const userId = user?.id;
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void Promise.all([
      ensureUserProfile(),
      createClient()
        .from("ratings")
        .select(
          "id,rating,comment,created_at,from_user:users!ratings_from_user_id_fkey(name)",
        )
        .eq("to_user_id", userId)
        .order("created_at", { ascending: false }),
    ])
      .then(([account, ratings]) => {
        if (!active) return;
        if (!account) {
          setError("Couldn’t load your profile. Sign in again and retry.");
          return;
        }
        setProfile(account);
        setReviews((ratings.data ?? []) as Review[]);
        if (ratings.error)
          setError("Your profile loaded, but reviews are unavailable.");
      })
      .catch(() => {
        if (active)
          setError("Couldn’t load your profile. Refresh to try again.");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">ACCOUNT</p>
        <h1>Your profile.</h1>
        <p>See your account details, reviews, and verification options.</p>
      </header>
      {error && (
        <p role="alert" className="mb-4 text-sm text-rose-700">
          {error}
        </p>
      )}
      {!profile && !error && <p role="status">Loading your profile…</p>}
      {profile && (
        <div className="workspace-book-grid">
          <div className="grid gap-4">
            <section className="workspace-surface">
              <div className="flex items-center gap-3">
                <span className="profile-avatar">
                  {(profile.name || user?.email || "R")
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold break-words">
                    {profile.name || "Rider"}
                  </h2>
                  <p className="text-sm text-slate-600 break-all">
                    {user?.email}
                  </p>
                </div>
              </div>
              <dl className="profile-details">
                <div>
                  <dt>Ride role</dt>
                  <dd className="capitalize">
                    {profile.role || "Choose at the ride desk"}
                  </dd>
                </div>
                <div>
                  <dt>Rating</dt>
                  <dd>
                    {profile.rating_count ? (
                      <RatingStars
                        rating={profile.rating_avg ?? 0}
                        size="sm"
                        showValue
                      />
                    ) : (
                      "No reviews yet"
                    )}
                  </dd>
                </div>
              </dl>
              <Link href="/dashboard/book" className="text-link">
                Open ride desk ↗
              </Link>
            </section>
            {reviews.length > 0 && (
              <section className="workspace-surface">
                <h2 className="text-lg font-bold">Recent reviews</h2>
                <ul className="mt-2 divide-y divide-slate-200">
                  {reviews.map((review) => {
                    const reviewer = Array.isArray(review.from_user)
                      ? review.from_user[0]
                      : review.from_user;
                    return (
                      <li className="py-3" key={review.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-sm">
                            {reviewer?.name || "Rider"}
                          </strong>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        {review.comment && (
                          <p className="mt-2 text-sm text-slate-600">
                            {review.comment}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
          <div className="profile-verification">
            <VerificationSection />
          </div>
        </div>
      )}
    </>
  );
}
