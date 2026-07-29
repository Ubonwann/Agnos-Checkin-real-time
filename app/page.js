import Link from "next/link";

function VitalLine() {
  return (
    <svg
      viewBox="0 0 600 60"
      className="w-full h-10 text-pine-500"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 30 H210 L228 8 L248 52 L266 30 H600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="mx-auto w-full max-w-4xl px-6 pt-20 pb-10 flex-1 flex flex-col">
        <p className="font-mono text-xs tracking-[0.2em] uppercase text-pine-600 mb-4">
          Agnos &middot; Check-in
        </p>
        <h1 className="font-display italic text-4xl sm:text-5xl leading-tight text-ink max-w-xl">
          Every check-in, seen the moment it happens.
        </h1>
        <p className="mt-4 text-slate-500 max-w-lg text-[15px] leading-relaxed">
          One form for patients, one live view for staff. What a patient
          types on their phone appears on the front desk screen instantly —
          no refresh, no waiting.
        </p>

        <div className="my-10 -mx-2">
          <VitalLine />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/patient"
            className="group rounded-2xl bg-surface border border-line p-6 flex flex-col justify-between hover:border-pine-500 transition-colors"
          >
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-clay-500">
                01 — Patient
              </span>
              <h2 className="font-display text-2xl mt-2 text-ink">
                Fill in my details
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                A short registration form. Takes about three minutes.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center text-sm font-medium text-pine-600 group-hover:translate-x-1 transition-transform">
              Start check-in &rarr;
            </span>
          </Link>

          <Link
            href="/staff"
            className="group rounded-2xl bg-ink text-paper p-6 flex flex-col justify-between hover:bg-pine-700 transition-colors"
          >
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-pine-300">
                02 — Staff
              </span>
              <h2 className="font-display text-2xl mt-2">
                Open the live view
              </h2>
              <p className="mt-2 text-sm text-white/60 leading-relaxed">
                Watch patient forms fill in as they happen.
              </p>
            </div>
            <span className="mt-6 inline-flex items-center text-sm font-medium text-pine-300 group-hover:translate-x-1 transition-transform">
              Open dashboard &rarr;
            </span>
          </Link>
        </div>
      </div>

      <footer className="border-t border-line py-5">
        <p className="text-center text-xs text-slate-400">
          Candidate assignment build &middot; Next.js + Socket.io
        </p>
      </footer>
    </main>
  );
}
