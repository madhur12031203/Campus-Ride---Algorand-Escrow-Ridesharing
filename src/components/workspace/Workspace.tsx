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
import type { UserRole } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfile } from "@/lib/supabase/rideshare";
import { rideDeskLabel, rideDeskPath, rideDeskRedirect } from "@/lib/ride-roles";
import RideIcon, { type RideIconName } from "@/components/RideIcon";

const WorkspaceAccount = createContext<{ user: User; role: UserRole } | null>(null);
export const useWorkspaceUser = () => useContext(WorkspaceAccount)?.user ?? null;
export const useWorkspaceRole = () => useContext(WorkspaceAccount)?.role ?? null;

const pages: { href: string; label: string; icon: RideIconName }[] = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/trips", label: "My trips", icon: "clock" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "wallet" },
  { href: "/dashboard/profile", label: "Profile", icon: "user" },
];

export default function Workspace({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [signOutError, setSignOutError] = useState(false);
  const [account, setAccount] = useState<{ id: string; role: UserRole | null; failed?: boolean } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const userId = user?.id;
  const resolvedAccount = account?.id === userId ? account : null;
  const role = resolvedAccount?.role;
  const redirect = role ? rideDeskRedirect(pathname, role) : null;

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

  useEffect(() => {
    if (!userId) {
      setAccount(null);
      return;
    }
    let active = true;
    void ensureUserProfile()
      .then((profile) => {
        if (!active) return;
        if (!profile) {
          // The browser may still have a cached session that the server has rejected.
          setUser(null);
          return;
        }
        setAccount({ id: userId, role: profile.role });
      })
      .catch(() => {
        if (active) setAccount({ id: userId, role: null, failed: true });
      });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (redirect) router.replace(redirect);
  }, [redirect, router]);

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

  if (!role || redirect) {
    const loading = !resolvedAccount || Boolean(redirect);
    return (
      <main id="main-content" className="workspace-gate">
        <section className="workspace-gate-card motion-enter">
          <Link className="workspace-brand" href="/"><span>↗</span> Campus Ride</Link>
          {loading ? <p className="mt-8" role="status">Opening your ride space…</p> : <>
            <h1 className="mt-8">{resolvedAccount?.failed ? "Couldn’t load your account." : "Finish setting up your ride account."}</h1>
            <p>{resolvedAccount?.failed
              ? "Try loading your ride space again."
              : "Sign in through the passenger or driver page once to set up your account."}</p>
            {resolvedAccount?.failed
              ? <button type="button" className="ride-button mt-5" onClick={() => window.location.reload()}>Retry</button>
              : <Link className="ride-button mt-5" href="/login">Go to sign in <RideIcon name="arrow" /></Link>}
          </>}
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
    <WorkspaceAccount.Provider value={{ user, role }}>
      <div className="workspace-shell" key={user.id}>
        <aside className="workspace-rail">
          <Link href="/" className="workspace-brand">
            <span>↗</span> Campus Ride
          </Link>
          <p className="workspace-rail-label">{role === "driver" ? "DRIVER WORKSPACE" : "PASSENGER WORKSPACE"}</p>
          <nav className="workspace-nav" aria-label="Ride workspace">
            {[pages[0], { href: rideDeskPath(role), label: rideDeskLabel(role), icon: "car" as const }, ...pages.slice(1)].map(({ href, label, icon }) => (
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
    </WorkspaceAccount.Provider>
  );
}
