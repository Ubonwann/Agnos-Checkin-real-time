"use client";

import { useEffect, useRef, useState } from "react";
import { FIELDS } from "../../lib/fields";
import StatusBadge from "./StatusBadge";

function timeAgo(ts) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.round(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  return `${m}m ago`;
}

export default function PatientCard({ session }) {
  const { data, status, sessionId, submittedAt } = session;
  const prevData = useRef(data);
  const [flashField, setFlashField] = useState(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const changed = FIELDS.find((f) => prevData.current[f.id] !== data[f.id]);
    if (changed) {
      setFlashField(changed.id);
      const t = setTimeout(() => setFlashField(null), 900);
      prevData.current = data;
      return () => clearTimeout(t);
    }
    prevData.current = data;
  }, [data]);

  // Re-render every 15s so "x ago" timestamps stay fresh.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ") || "New patient";
  const filledCount = FIELDS.filter((f) => (data[f.id] || "").toString().trim()).length;

  return (
    <div
      className={`rounded-2xl border bg-surface p-5 transition-colors ${
        status === "submitted" ? "border-pine-200" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink truncate">{fullName}</h3>
          <p className="font-mono text-[11px] text-slate-400 mt-0.5">
            {sessionId.slice(0, 8)} &middot; {filledCount}/{FIELDS.length} fields
            {status === "submitted" && submittedAt ? ` \u00b7 submitted ${timeAgo(submittedAt)}` : ""}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {FIELDS.map((field) => (
          <div
            key={field.id}
            className={`min-w-0 rounded-md -mx-1.5 px-1.5 py-0.5 transition-colors duration-700 ${
              flashField === field.id ? "bg-pine-50" : "bg-transparent"
            }`}
          >
            <dt className="text-[10px] uppercase tracking-wide text-slate-400 truncate">
              {field.label}
            </dt>
            <dd className="text-sm text-ink truncate" title={data[field.id] || ""}>
              {data[field.id] || <span className="text-slate-300">&mdash;</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
