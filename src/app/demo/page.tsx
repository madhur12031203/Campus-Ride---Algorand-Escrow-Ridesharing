"use client";
import Link from "next/link";
import { useState } from "react";
export default function DemoPage() {
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  return (
    <main id="main-content" className="site-container steps-section">
      <p className="eyebrow">INTERACTIVE PREVIEW · SAMPLE DATA ONLY</p>
      <h1 className="text-4xl tracking-tight mt-4 mb-3">
        Get to know your dashboard.
      </h1>
      <p className="text-slate-600 max-w-2xl">
        Explore the passenger and driver views. This preview does not create an
        account, book a ride, request your location, or connect to a wallet.
      </p>
      <div className="flex gap-3 my-7" role="group" aria-label="Preview role">
        {(["passenger", "driver"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={value === role}
            className={value === role ? "button-primary" : "button-secondary"}
            onClick={() => setRole(value)}
          >
            {value === "passenger" ? "Passenger view" : "Driver view"}
          </button>
        ))}
      </div>
      <div className="steps-grid">
        <article className="step-card">
          <span className="eyebrow">SAMPLE JOURNEY</span>
          <h2 className="text-xl mt-5">
            {role === "passenger"
              ? "Your next ride"
              : "A request on your route"}
          </h2>
          <p>Student residences → Main campus</p>
          <p>Example departure: 9:00 AM</p>
          <span className="inline-block rounded-full bg-[#eaf0da] px-3 py-1 text-xs mt-5">
            {role === "passenger"
              ? "Waiting for a driver"
              : "Passenger requesting a seat"}
          </span>
        </article>
        <article className="step-card">
          <span className="eyebrow">WHAT HAPPENS NEXT</span>
          <h2 className="text-xl mt-5">
            {role === "passenger" ? "Follow your journey" : "Manage your rides"}
          </h2>
          <p>
            {role === "passenger"
              ? "After signing in, request a ride and follow driver acceptance and trip updates in your dashboard."
              : "After signing in, choose the driver role, review nearby requests, and track accepted rides."}
          </p>
        </article>
        <article className="step-card">
          <span className="eyebrow">DEVELOPMENT STATUS</span>
          <h2 className="text-xl mt-5">Payments are not live</h2>
          <p>
            The contract source is included in the project. Connecting the
            website to its deposit and release methods is still required. Demo
            data never represents a real payment.
          </p>
        </article>
      </div>
      <div className="mt-9 flex gap-3 flex-wrap">
        <Link href="/login" className="button-primary">
          Sign in to get started ↗
        </Link>
        <Link href="/" className="button-secondary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
