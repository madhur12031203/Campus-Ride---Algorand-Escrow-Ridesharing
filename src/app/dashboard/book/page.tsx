import CoreRideSharePanel from "@/components/rideshare/CoreRideSharePanel";
import RideIcon from "@/components/RideIcon";

export default function BookPage() {
  return (
    <>
      <header className="workspace-heading">
        <p className="workspace-kicker">RIDE DESK</p>
        <h1>Book or drive.</h1>
        <p>
          Request a pickup as a passenger or review nearby requests as a driver.
        </p>
      </header>
      <div className="workspace-book-grid">
        <section className="workspace-surface">
          <CoreRideSharePanel />
        </section>
        <aside className="workspace-book-guide">
          <RideIcon name="route" />
          <h2>From pickup to arrival</h2>
          <ol>
            <li>
              <strong>Set your route.</strong> Choose a pickup and destination.
            </li>
            <li>
              <strong>Get matched.</strong> A nearby driver can accept your
              request.
            </li>
            <li>
              <strong>Confirm the ride.</strong> Both people confirm completion.
            </li>
          </ol>
          <p>Testnet payments are disabled. A wallet is optional.</p>
        </aside>
      </div>
    </>
  );
}
