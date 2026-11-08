import Link from "next/link";

export function RouteIllustration() {
  return (
    <div
      className="route-scene"
      role="img"
      aria-label="Illustrated campus route connecting the student residences to campus"
    >
      <div className="map-grid" />
      <div className="map-park park-one" />
      <div className="map-park park-two" />
      <svg
        className="map-roads"
        viewBox="0 0 600 520"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M-30 150H640M-20 360H630M150-20V560M440-20V550"
          stroke="#fff"
          strokeWidth="34"
        />
        <path
          d="M-30 150H640M-20 360H630M150-20V560M440-20V550"
          stroke="#d9dfd1"
          strokeWidth="1"
          strokeDasharray="7 7"
        />
        <path
          d="M150 390V210Q150 150 210 150H380Q440 150 440 210V270"
          stroke="#fff"
          strokeWidth="15"
        />
        <path
          className="route-line"
          d="M150 390V210Q150 150 210 150H380Q440 150 440 210V270"
          stroke="#23754f"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="9 10"
        />
        <circle
          cx="150"
          cy="390"
          r="13"
          fill="#23754f"
          stroke="white"
          strokeWidth="5"
        />
        <circle
          cx="440"
          cy="270"
          r="13"
          fill="#23754f"
          stroke="white"
          strokeWidth="5"
        />
      </svg>
      <div className="map-building building-one">
        <span>▥</span>
      </div>
      <div className="map-building building-two">
        <span>▥</span>
      </div>
      <span className="map-label label-one">STUDENT RESIDENCES</span>
      <span className="map-label label-two">CAMPUS GREEN</span>
      <div className="campus-building">
        <span className="campus-roof" />
        <div>▥ &nbsp; ▥ &nbsp; ▥</div>
        <small>CAMPUS</small>
      </div>
      <div className="map-car" aria-hidden="true">
        <svg viewBox="0 0 60 32">
          <rect x="3" y="5" width="54" height="23" rx="10" fill="#184a36" />
          <rect x="18" y="8" width="23" height="17" rx="4" fill="#d8ecd8" />
          <path d="M29 8v17" stroke="#184a36" strokeWidth="3" />
          <path
            d="M10 3h10m20 0h10M10 30h10m20 0h10"
            stroke="#152b20"
            strokeWidth="4"
          />
        </svg>
      </div>
      <div className="map-tag pickup-tag">
        <span className="location-dot" /> Your next chapter starts here
      </div>
      <div className="map-tag arrival-tag">
        <span className="arrival-icon">↗</span>
        <div>
          <strong>A better way to campus</strong>
          <small>Shared rides. Shared experiences.</small>
        </div>
      </div>
      <span className="map-caption">
        A little less traffic. A lot more connection.
      </span>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main id="main-content" className="landing">
      <section className="hero site-container">
        <div className="hero-copy enter">
          <div className="eyebrow">
            <span /> YOUR CAMPUS. YOUR PEOPLE. YOUR RIDE.
          </div>
          <h1>
            Good company.
            <br />
            Better rides.
            <br />
            <em>Campus bound.</em>
          </h1>
          <p className="hero-description">
            From your first lecture to your last plan of the day. Find a ride
            with people headed your way, split the journey, and make campus feel
            a little closer.
          </p>
          <div className="hero-actions">
            <Link href="/login/passenger" className="button-primary">
              Find a ride <span>↗</span>
            </Link>
            <Link href="/login/driver" className="button-secondary">
              Offer a ride <span>→</span>
            </Link>
          </div>
          <div className="hero-note">
            <span className="mini-avatars">
              <i>✦</i>
              <i>↗</i>
              <i>☺</i>
            </span>
            <span>
              Made for your everyday.
              <br />
              <strong>Built around your campus.</strong>
            </span>
          </div>
        </div>
        <div className="hero-art enter">
          <div className="art-topline">
            <span>
              <i /> THE CAMPUS CONNECTION
            </span>
            <span>GO TOGETHER ↗</span>
          </div>
          <RouteIllustration />
        </div>
      </section>
      <div className="benefit-strip">
        <div className="site-container">
          <span>
            Small journeys. <strong>Big difference.</strong>
          </span>
          <span>◎ &nbsp; Connect with your campus</span>
          <span>↗ &nbsp; Share the journey</span>
          <span>◈ &nbsp; Compare your options</span>
        </div>
      </div>
      <section id="how-it-works" className="site-container steps-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">LESS PLANNING. MORE LIVING.</p>
            <h2>Your next ride, simplified.</h2>
          </div>
          <p>
            A few simple steps.
            <br />A better everyday commute.
          </p>
        </div>
        <div className="steps-grid">
          {[
            [
              "01",
              "⌖",
              "Choose your way",
              "Heading to campus or heading home? Sign in as a passenger or offer a seat as a driver.",
            ],
            [
              "02",
              "⇄",
              "Find your connection",
              "Enter your route, explore available rides, and compare estimated fares in one place.",
            ],
            [
              "03",
              "↗",
              "Make the journey",
              "Confirm your ride and keep track of your trip from your dashboard.",
            ],
          ].map(([number, icon, title, description]) => (
            <article className="step-card" key={number}>
              <div className="step-top">
                <span className="step-icon">{icon}</span>
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="why-campus-ride"
        className="site-container community-section"
      >
        <div>
          <p className="eyebrow">MORE THAN GETTING THERE</p>
          <h2>
            Same direction.
            <br />
            <em>Better together.</em>
          </h2>
          <p>
            Your commute is part of your campus life. Make room for shared
            journeys, familiar faces, and a smarter way to get around.
          </p>
          <Link href="/about" className="text-link">
            Get to know Campus Ride <span>↗</span>
          </Link>
        </div>
        <div className="community-features">
          <article>
            <span>◎</span>
            <div>
              <h3>A campus-first community</h3>
              <p>
                Passenger and driver profiles keep your campus connection at the
                heart of every ride.
              </p>
            </div>
          </article>
          <article>
            <span>◈</span>
            <div>
              <h3>More clarity before you go</h3>
              <p>
                Compare estimated fares and choose the option that works for
                your journey.
              </p>
            </div>
          </article>
          <article>
            <span>↔</span>
            <div>
              <h3>One place for your trip</h3>
              <p>
                Ride requests and booking updates come together in your
                dashboard.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="site-container">
        <div className="closing-banner">
          <div>
            <p className="eyebrow">YOUR NEXT JOURNEY STARTS HERE</p>
            <h2>Let’s go somewhere. Together.</h2>
          </div>
          <Link href="/login" className="button-primary">
            Get started <span>↗</span>
          </Link>
        </div>
      </section>
      <footer className="site-container site-footer">
        <Link href="/" className="wordmark">
          <span className="brand-icon">↗</span> campus<span>ride</span>
        </Link>
        <p>A better way to get there, together.</p>
        <Link href="/about">About the project ↗</Link>
      </footer>
    </main>
  );
}
