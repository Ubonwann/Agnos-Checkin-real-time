const STATUS_CONFIG = {
  filling: { label: "Filling in", dot: "bg-amber-500", text: "text-amber-500", pulse: true },
  idle: { label: "Idle", dot: "bg-slate-400", text: "text-slate-500", pulse: false },
  submitted: { label: "Submitted", dot: "bg-pine-500", text: "text-pine-600", pulse: false },
  left: { label: "Left", dot: "bg-slate-300", text: "text-slate-400", pulse: false },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${config.dot} animate-pulseDot`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {config.label}
    </span>
  );
}
