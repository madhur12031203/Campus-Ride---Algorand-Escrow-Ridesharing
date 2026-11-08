"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      const supabase = createClient();
      const update = (active: boolean) => {
        setSignedIn(active);
        if (active)
          void fetch("/api/admin/verify")
            .then((r) => r.json())
            .then((data) => setIsAdmin(data.isAdmin === true))
            .catch(() => setIsAdmin(false));
        else setIsAdmin(false);
      };
      void supabase.auth
        .getSession()
        .then(({ data }) => update(Boolean(data.session)))
        .catch(() => update(false));
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) =>
        update(Boolean(session)),
      );
      return () => subscription.unsubscribe();
    } catch {
      /* Public pages remain available before authentication is configured. */
    }
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <nav className="site-container nav-inner" aria-label="Main navigation">
          <Link href="/" className="wordmark" aria-label="Campus Ride home">
            <span className="brand-icon">↗</span> campus<span>ride</span>
            <small>THE BETTER WAY</small>
          </Link>
          <button
            className="menu-toggle"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="main-navigation"
            onClick={() => setOpen(!open)}
          >
            {open ? "✕" : "☰"}
          </button>
          <div
            id="main-navigation"
            className={`nav-links ${open ? "is-open" : ""}`}
            onClick={() => setOpen(false)}
          >
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#why-campus-ride">Why Campus Ride</Link>
            <Link href="/about">About us</Link>
            {signedIn ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <Link href="/profile">Profile</Link>
                {isAdmin && <Link href="/admin/verifications">Admin</Link>}
                <button
                  className="nav-cta"
                  onClick={async () => {
                    await createClient().auth.signOut();
                    router.push("/login");
                  }}
                >
                  Sign out ↗
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-login">
                  Log in
                </Link>
                <Link href="/login" className="nav-cta">
                  Let’s ride <span>↗</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}
