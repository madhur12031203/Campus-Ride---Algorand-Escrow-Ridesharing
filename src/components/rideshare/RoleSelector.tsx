"use client";

import type { UserRole } from "@/types";

type RoleSelectorProps = {
  onPickRole: (role: UserRole) => Promise<void>;
  isSaving: boolean;
};

function DriverIcon() {
  return (
    <svg className="h-6 w-6 text-cyan-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function PassengerIcon() {
  return (
    <svg className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

export default function RoleSelector({ onPickRole, isSaving }: RoleSelectorProps) {
  return (
    <div className="cyber-glass rounded-2xl p-6 border border-white/10 shadow-2xl">
      <div className="mb-6 text-center">
        <span className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
          Workflow Terminal
        </span>
        <h3 className="text-xl font-bold tracking-tight text-white">Select Your Session Role</h3>
        <p className="mt-1 text-xs text-slate-400">Choose whether you are driving or requesting rides for this session.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onPickRole("driver")}
          className="group relative rounded-xl border border-cyan-500/20 bg-slate-900/60 p-5 text-left transition-all hover:border-cyan-400/60 hover:bg-cyan-950/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <DriverIcon />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">Campus Driver</p>
            <span className="text-[10px] font-mono uppercase text-cyan-400 opacity-75">Earn ALGO</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Accept real-time ride requests within 8 km with guaranteed contract settlement.
          </p>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => void onPickRole("passenger")}
          className="group relative rounded-xl border border-emerald-500/20 bg-slate-900/60 p-5 text-left transition-all hover:border-emerald-400/60 hover:bg-emerald-950/20 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="mb-3 inline-grid h-12 w-12 place-items-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <PassengerIcon />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">Campus Passenger</p>
            <span className="text-[10px] font-mono uppercase text-emerald-400 opacity-75">Trust Escrow</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Book instant campus trips with payment safely locked until you confirm completion.
          </p>
        </button>
      </div>
    </div>
  );
}
