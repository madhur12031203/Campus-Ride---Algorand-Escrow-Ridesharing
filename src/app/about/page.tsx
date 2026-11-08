import Link from "next/link";
export default function AboutPage() {
  return (
    <main id="main-content" className="landing">
      <section className="site-container steps-section enter">
        <p className="eyebrow">HELLO, CAMPUS RIDE</p>
        <div className="community-section !pb-8 !pt-8">
          <div>
            <h1 className="text-5xl tracking-tight leading-tight">
              A shared direction.
              <br />
              <em>A better everyday.</em>
            </h1>
          </div>
          <div>
            <p>
              Campus Ride brings shared campus journeys and estimated fare
              comparisons into one place. It’s built for students who need a
              ride and drivers with a seat to share.
            </p>
            <p className="mt-5">
              Choose your role, set up your profile, and use your dashboard to
              request or offer rides. Compare estimates across Uber, Ola, and
              Rapido before choosing how to travel.
            </p>
          </div>
        </div>
        <div className="steps-grid mt-8">
          {[
            [
              "Built around campus",
              "Passenger and driver profiles, ride requests, and booking updates help your community get moving.",
            ],
            [
              "Clarity for your journey",
              "Fare comparisons are estimates. Check the provider’s final price before booking your trip.",
            ],
            [
              "A project in progress",
              "The Algorand contract is part of this project. Website payments are disabled while the integration is being completed.",
            ],
          ].map(([title, copy]) => (
            <article className="step-card" key={title}>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>
        <div className="closing-banner mt-14">
          <div>
            <p className="eyebrow">LET’S GO TOGETHER</p>
            <h2>Your next campus connection awaits.</h2>
          </div>
          <Link href="/login" className="button-primary">
            Find your way ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
