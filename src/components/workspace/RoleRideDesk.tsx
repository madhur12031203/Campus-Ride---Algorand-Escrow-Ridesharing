"use client";

import RideIcon from "@/components/RideIcon";
import CoreRideSharePanel from "@/components/rideshare/CoreRideSharePanel";
import { useWorkspaceRole, useWorkspaceUser } from "./Workspace";
import type { UserRole } from "@/types";

export default function RoleRideDesk({ role }: { role: UserRole }) {
  const user = useWorkspaceUser();
  const accountRole = useWorkspaceRole();
  if (!user || accountRole !== role) return null;

  const driver = role === "driver";

  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">{driver ? "DRIVER DESK" : "PASSENGER DESK"}</p>
        <h1>{driver ? "Ride requests." : "Book a ride."}</h1>
        <p>{driver
          ? "Set your location, review nearby pickups, and manage your active ride."
          : "Choose a pickup and destination, then follow your ride here."}</p>
      </header>
      <div className="workspace-book-grid">
        <section className="workspace-surface">
          <CoreRideSharePanel accountId={user.id} role={role} />
        </section>
        <aside className="workspace-book-guide">
          <RideIcon name={driver ? "car" : "route"} />
          <h2>{driver ? "Your next pickup" : "From pickup to arrival"}</h2>
          {driver ? (
            <ol>
              <li><strong>Set your location.</strong> See nearby requests.</li>
              <li><strong>Accept a ride.</strong> Your passenger sees the update.</li>
              <li><strong>Confirm completion.</strong> Both people confirm the trip.</li>
            </ol>
          ) : (
            <ol>
              <li><strong>Set your route.</strong> Choose a pickup and destination.</li>
              <li><strong>Get matched.</strong> A nearby driver can accept your request.</li>
              <li><strong>Confirm completion.</strong> Both people confirm the trip.</li>
            </ol>
          )}
          <p>Testnet payments are disabled. A wallet is optional.</p>
        </aside>
      </div>
    </>
  );
}
