"use client";

import Link from "next/link";
import { useState } from "react";
import RideIcon from "@/components/RideIcon";

export default function DemoPage() {
  const [role, setRole] = useState<"passenger" | "driver">("passenger");
  const passenger = role === "passenger";

  return (
    <main id="main-content" className="ride-container ride-steps">
      <header className="workspace-heading motion-enter">
        <p className="workspace-kicker">SAMPLE TRIP PREVIEW</p>
        <h1>Take a look around.</h1>
        <p>
          Switch roles to see what each person sees when a ride is requested.
        </p>
      </header>
      <div className="workspace-book-grid">
        <section className="workspace-surface">
          <div className="trip-filters" role="group" aria-label="Preview role">
            {(["passenger", "driver"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={role === value}
                onClick={() => setRole(value)}
              >
                {value === "passenger" ? "Passenger view" : "Driver view"}
              </button>
            ))}
          </div>
          <div key={role} className="demo-sample motion-enter">
            <span className="workspace-action-icon">
              <RideIcon name={passenger ? "pin" : "car"} />
            </span>
            <div>
              <p className="workspace-kicker">EXAMPLE REQUEST</p>
              <h2>{passenger ? "Your next ride" : "A pickup near you"}</h2>
              <p>Market Square → Central Station</p>
              <span className="trip-status" data-status="waiting">
                {passenger
                  ? "Waiting for a driver"
                  : "Passenger requesting a seat"}
              </span>
            </div>
          </div>
        </section>
        <aside className="workspace-book-guide">
          <RideIcon name="route" />
          <h2>{passenger ? "Follow your journey" : "Choose a request"}</h2>
          <p>
            {passenger
              ? "In your account, request a ride and see the status update when a driver accepts."
              : "In your account, set a location and see waiting requests near your pickup area."}
          </p>
          <p>This preview uses sample data. Testnet payments are disabled.</p>
        </aside>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/login" className="ride-button">
          Get started <RideIcon name="arrow" />
        </Link>
        <Link href="/" className="ride-button ride-button-outline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
