"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import RideIcon, { type RideIconName } from "@/components/RideIcon";

const WorkspaceUser = createContext<User | null>(null);
export const useWorkspaceUser = () => useContext(WorkspaceUser);

const pages: { href: string; label: string; icon: RideIconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/book", label: "Book a ride", icon: "car" },
  { href: "/dashboard/trips", label: "My trips", icon: "clock" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
  { href: "/dashboard/profile", label: "Profile", icon: "user" },
];

export default function Workspace({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [signOutError, setSignOutError] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) setChecking(false);
    }, 6000);
    const update = (next: User | null) => {
      if (!active) return;
      setUser(next);
      setChecking(false);
      window.clearTimeout(timer);
    };
    try {
      const supabase = createClient();
      let observedSession = false;
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        observedSession = true;
        update(session?.user ?? null);
      });
      void supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!observedSession) update(data.session?.user ?? null);
        })
        .catch(() => {
          if (!observedSession) update(null);
        });
      return () => {
        active = false;
        window.clearTimeout(timer);
        subscription.unsubscribe();
      };
    } catch {
      update(null);
      return () => window.clearTimeout(timer);
    }
  }, []);

  if (!user) {
    return (
      <main id="main-content" className="workspace-gate">
        <section className="workspace-gate-card motion-enter">
          <Link className="workspace-brand" href="/">
            <span>↗</span> Campus Ride
          </Link>
          {checking ? (
            <p role="status" className="mt-8">
              Checking your account…
            </p>
          ) : (
            <>
              <p className="workspace-kicker mt-8">YOUR RIDE SPACE</p>
              <h1>Ready when you are.</h1>
              <p>
                Sign in to book a ride, see your trips, and manage your wallet.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/login" className="ride-button">
                  Sign in <RideIcon name="arrow" />
                </Link>
                <Link href="/demo" className="ride-button ride-button-outline">
                  Try the demo
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  const name =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const displayName = name || user.email?.split("@")[0] || "Rider";

  return (
    <WorkspaceUser.Provider value={user}>
      <div className="workspace-shell" key={user.id}>
        <aside className="workspace-rail">
          <Link href="/" className="workspace-brand">
            <span>↗</span> Campus Ride
          </Link>
          <p className="workspace-rail-label">WORKSPACE</p>
          <nav className="workspace-nav" aria-label="Ride workspace">
            {pages.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                <RideIcon name={icon} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="workspace-account">
            <span className="workspace-avatar">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="workspace-account-name">{displayName}</span>
            <button
              type="button"
              aria-label="Sign out"
              onClick={async () => {
                try {
                  const { error } = await createClient().auth.signOut();
                  if (error) throw error;
                  router.push("/login");
                } catch {
                  setSignOutError(true);
                }
              }}
            >
              <RideIcon name="logout" />
            </button>
          </div>
          {signOutError && (
            <p className="px-2 text-sm text-rose-200" role="alert">
              Could not sign out. Try again.
            </p>
          )}
        </aside>
        <main id="main-content" className="workspace-content">
          <div key={pathname} className="workspace-page motion-enter">
            {children}
          </div>
        </main>
      </div>
    </WorkspaceUser.Provider>
  );
}
