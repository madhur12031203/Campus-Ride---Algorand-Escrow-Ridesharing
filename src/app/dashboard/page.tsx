import Link from "next/link";
import Image from "next/image";
import RideIcon, { type RideIconName } from "@/components/RideIcon";

const actions: {
  href: string;
  icon: RideIconName;
  title: string;
  description: string;
}[] = [
  {
    href: "/dashboard/book",
    icon: "car",
    title: "Book a ride",
    description: "Set your route or switch to the driver view.",
  },
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
  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">OVERVIEW</p>
        <h1>Your ride space.</h1>
        <p>Request a pickup, follow your trips, or manage your wallet.</p>
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
            <i /> SHARED RIDES
          </span>
          <h2>Where to?</h2>
          <p>Heading out or offering a seat? Start with your route.</p>
          <Link href="/dashboard/book" className="ride-button">
            Plan a ride <RideIcon name="arrow" />
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
