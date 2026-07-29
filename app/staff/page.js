"use client";

import { useMemo, useState } from "react";
import { useStaffSessions } from "../../hooks/useStaffSessions";
import PatientCard from "../../components/staff/PatientCard";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "filling", label: "Filling in" },
  { id: "idle", label: "Idle" },
  { id: "submitted", label: "Submitted" },
];

export default function StaffPage() {
  const { sessions, connected } = useStaffSessions();
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const c = { all: sessions.length, filling: 0, idle: 0, submitted: 0, left: 0 };
    for (const s of sessions) c[s.status] = (c[s.status] || 0) + 1;
    return c;
  }, [sessions]);

  const visible = sessions
    .filter((s) => s.status !== "left")
    .filter((s) => filter === "all" || s.status === filter)
    .reverse();

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="font-mono text-xs tracking-[0.2em] uppercase text-pine-600">
              Agnos &middot; Staff view
            </p>
            <h1 className="font-display italic text-3xl mt-2 text-ink">Live check-ins</h1>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-pine-500" : "bg-amber-500"}`} />
            {connected ? "Live" : "Connecting\u2026"}
          </span>
        </header>

        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
                filter === f.id
                  ? "bg-ink text-paper border-ink"
                  : "bg-surface text-slate-500 border-line hover:border-pine-500"
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{counts[f.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-20 text-center">
            <p className="text-sm text-slate-400">
              No {filter === "all" ? "" : `${filter} `}check-ins right now.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((session) => (
              <PatientCard key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
