import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthSplit({
  children,
  headline,
  detail,
}: {
  children: ReactNode;
  headline: string;
  detail: string;
}) {
  return (
    <main id="main-content" className="auth-page auth-redesign">
      <div className="auth-split">
        <div className="auth-visual motion-enter" aria-hidden="true">
          <Image
            src="/images/ride-interior.webp"
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 520px"
          />
          <div className="auth-visual-copy">
            <span className="ride-label">
              <i /> CAMPUS RIDE
            </span>
            <h2>{headline}</h2>
            <p>{detail}</p>
          </div>
        </div>
        <section className="auth-split-form motion-enter">{children}</section>
      </div>
    </main>
  );
}
