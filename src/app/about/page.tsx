import Link from "next/link";
import AuthSplit from "@/components/auth/AuthSplit";
import RideIcon from "@/components/RideIcon";

export default function AboutPage() {
  return (
    <AuthSplit
      headline="Better shared."
      detail="A simpler way to find a ride or offer a seat."
    >
      <p className="workspace-kicker">ABOUT CAMPUS RIDE</p>
      <h1 className="auth-choice-heading">One route. A shared ride.</h1>
      <p className="auth-choice-detail">
        Campus Ride brings passengers and nearby drivers together. Request a
        ride, follow it from acceptance to completion, and see past journeys in
        your account.
      </p>
      <div className="workspace-book-guide mb-5">
        <RideIcon name="shield" />
        <h2>What’s being built next</h2>
        <p>
          We’re working on replacement rides after a cancellation and testing
          Algorand escrow separately. Ride payments are currently disabled.
        </p>
      </div>
      <Link href="/demo" className="ride-button">
        Explore the demo <RideIcon name="arrow" />
      </Link>
    </AuthSplit>
  );
}
