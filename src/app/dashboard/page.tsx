"use client";

import Link from "next/link";
import Image from "next/image";
import RideIcon, { type RideIconName } from "@/components/RideIcon";
import { useWorkspaceRole } from "@/components/workspace/Workspace";
import { rideDeskLabel, rideDeskPath } from "@/lib/ride-roles";

const secondaryActions: {
  href: string;
  icon: RideIconName;
  title: string;
  description: string;
}[] = [
  {
    href: "/dashboard/trips",
    icon: "clock",
    title: "My trips",
    description: "Check ride progress and revisit past journeys.",
  },
  {
    href: "/dashboard/wallet",
    icon: "wallet",
    title: "Wallet",
    description: "Manage your optional Pera Wallet connection.",
  },
];

export default function Dashboard() {
  const role = useWorkspaceRole();
  if (!role) return null;
  const driver = role === "driver";
  const desk = rideDeskPath(role);
  const actions = [
    {
      href: desk,
      icon: "car" as const,
      title: rideDeskLabel(role),
      description: driver ? "See nearby requests and manage your active ride." : "Choose your pickup and destination.",
    },
    ...secondaryActions,
  ];
  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">OVERVIEW</p>
        <h1>{driver ? "Driver overview." : "Passenger overview."}</h1>
        <p>{driver ? "Find your next pickup and follow your trips." : "Request a pickup and follow your trips."}</p>
      </header>
      <section className="workspace-hero">
        <Image
          src="/images/ride-evening.webp"
          alt=""
          fill
          sizes="(max-width: 760px) 100vw, 1000px"
          className="workspace-hero-image"
        />
        <div className="workspace-hero-shade" />
        <div className="workspace-hero-copy">
          <span className="ride-label">
            <i /> {driver ? "DRIVER ACCOUNT" : "PASSENGER ACCOUNT"}
          </span>
          <h2>{driver ? "Find your next pickup." : "Where to?"}</h2>
          <p>{driver ? "Set your location to see passengers nearby." : "Tell us where you need a pickup and where you’re going."}</p>
          <Link href={desk} className="ride-button">
            {driver ? "See ride requests" : "Plan a ride"} <RideIcon name="arrow" />
          </Link>
        </div>
      </section>
      <div className="workspace-actions">
        {actions.map(({ href, icon, title, description }, index) => (
          <Link
            href={href}
            key={href}
            className="workspace-action motion-enter"
            style={{ animationDelay: `${index * 65}ms` }}
          >
            <span className="workspace-action-icon">
              <RideIcon name={icon} />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <RideIcon name="arrow" />
          </Link>
        ))}
      </div>
    </>
  );
}
