import Link from "next/link";
import AuthSplit from "@/components/auth/AuthSplit";
import RideIcon from "@/components/RideIcon";

export default function LoginPage() {
  return (
    <AuthSplit
      headline="The road ahead."
      detail="A pickup, a spare seat, and a simpler way to share the ride."
    >
      <p className="workspace-kicker">GET STARTED</p>
      <h1 className="auth-choice-heading">How are you riding?</h1>
      <p className="auth-choice-detail">
        Choose a role to sign in. You can switch at the ride desk when you have
        no active ride.
      </p>
      <div className="grid gap-3">
        <Link href="/login/passenger" className="workspace-action">
          <span className="workspace-action-icon">
            <RideIcon name="pin" />
          </span>
          <span>
            <strong>I need a ride</strong>
            <small>Request a pickup and follow your trip.</small>
          </span>
          <RideIcon name="arrow" />
        </Link>
        <Link href="/login/driver" className="workspace-action">
          <span className="workspace-action-icon">
            <RideIcon name="car" />
          </span>
          <span>
            <strong>I’m driving</strong>
            <small>Find and accept nearby ride requests.</small>
          </span>
          <RideIcon name="arrow" />
        </Link>
      </div>
      <Link href="/demo" className="text-link">
        Explore the demo first ↗
      </Link>
    </AuthSplit>
  );
}
