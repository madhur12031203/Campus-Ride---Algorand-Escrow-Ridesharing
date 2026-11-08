import Link from "next/link";
import Image from "next/image";
import RideIcon, { type RideIconName } from "@/components/RideIcon";

const steps: { icon: RideIconName; title: string; detail: string }[] = [
  {
    icon: "pin",
    title: "Set your route",
    detail: "Tell us where you need a pickup and where you’re headed.",
  },
  {
    icon: "car",
    title: "Meet your driver",
    detail:
      "A nearby driver accepts your request and the trip updates in your account.",
  },
  {
    icon: "clock",
    title: "Wrap up the trip",
    detail: "Both people confirm completion. Your trip stays in your history.",
  },
];

export default function LandingPage() {
  return (
    <main id="main-content" className="ride-landing">
      <section className="ride-hero">
        <div className="ride-container ride-hero-grid">
          <div className="ride-hero-copy motion-enter">
            <p className="ride-label">
              <i /> YOUR EVERYDAY RIDE
            </p>
            <h1>
              Going the
              <br />
              same <em>way?</em>
            </h1>
            <p>
              Request a pickup, share the journey, and keep track of every ride
              in one place.
            </p>
            <div className="ride-hero-actions">
              <Link href="/login/passenger" className="ride-button">
                Find a ride <RideIcon name="arrow" />
              </Link>
              <Link
                href="/login/driver"
                className="ride-button ride-button-ghost"
              >
                I’m driving <RideIcon name="car" />
              </Link>
            </div>
            <Link href="/demo" className="ride-demo-link">
              Explore the demo <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <figure className="ride-hero-photo motion-enter">
            <Image
              src="/images/ride-evening.webp"
              alt="A passenger meeting her ride at an evening curbside pickup"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 60vw"
            />
            <div className="ride-photo-fade" />
            <figcaption>
              <RideIcon name="pin" />
              <div>
                <strong>Meet at your pickup</strong>
                <small>One route. A shared ride.</small>
              </div>
            </figcaption>
          </figure>
        </div>
      </section>
      <section id="how-it-works" className="ride-container ride-steps">
        <div className="ride-section-heading">
          <p className="workspace-kicker">HOW IT WORKS</p>
          <h2>From here to there.</h2>
          <p>Three steps, with live updates along the way.</p>
        </div>
        <ol className="ride-steps-grid">
          {steps.map(({ icon, title, detail }, index) => (
            <li key={title}>
              <div className="ride-step-top">
                <span>
                  <RideIcon name={icon} />
                </span>
                <span>0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{detail}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="ride-container ride-roles" id="why-campus-ride">
        <div className="ride-role-card">
          <p className="workspace-kicker">PASSENGERS</p>
          <h2>Need a lift?</h2>
          <p>
            Put in your route and follow the request from pickup to completion.
          </p>
          <Link href="/login/passenger">
            Continue as a passenger <RideIcon name="arrow" />
          </Link>
        </div>
        <div className="ride-role-card ride-role-dark">
          <p className="workspace-kicker">DRIVERS</p>
          <h2>Got a seat?</h2>
          <p>Set your location and pick up a request that fits your journey.</p>
          <Link href="/login/driver">
            Continue as a driver <RideIcon name="arrow" />
          </Link>
        </div>
      </section>
      <footer className="ride-container ride-footer">
        <Link href="/" className="wordmark">
          <span className="brand-icon">↗</span> Campus Ride
        </Link>
        <Link href="/about">
          About the project <span aria-hidden="true">↗</span>
        </Link>
      </footer>
    </main>
  );
}
