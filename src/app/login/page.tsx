import Link from "next/link";
export default function LoginPage() {
  return (
    <main id="main-content" className="auth-page">
      <div className="auth-intro enter">
        <p className="eyebrow justify-center mb-4">THERE’S A SEAT FOR YOU</p>
        <h1>Where will today take you?</h1>
        <p>Choose how you’d like to travel. We’ll take it from here.</p>
      </div>
      <div className="role-options enter">
        <Link href="/login/passenger" className="role-option">
          <span className="step-icon">↗</span>
          <h2>Find your ride.</h2>
          <p>
            Meet your campus on the move. Find available seats, compare fares,
            and manage your journey.
          </p>
          <span className="text-link">Continue as a passenger ↗</span>
        </Link>
        <Link href="/login/driver" className="role-option">
          <span className="step-icon">⇄</span>
          <h2>Share your route.</h2>
          <p>
            Going that way anyway? Offer a seat, accept ride requests, and make
            the trip together.
          </p>
          <span className="text-link">Continue as a driver ↗</span>
        </Link>
      </div>
      <p className="text-center mt-9 text-xs text-[#7b8375]">
        <Link href="/demo" className="text-link">
          Just looking? Explore the demo →
        </Link>
      </p>
    </main>
  );
}
