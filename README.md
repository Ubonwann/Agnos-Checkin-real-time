# Agnos Check-in — Real-Time Patient Intake

A responsive patient intake form and a live staff dashboard that stay in sync
in real time. What a patient types on their phone shows up on the staff
screen as they type it — no refresh, no polling delay.

**Live demo:** _add your deployed URL here_
**Patient form:** `/patient` &nbsp;&middot;&nbsp; **Staff view:** `/staff`

---

## Stack

| Layer               | Choice                                   |
| -------------------- | ----------------------------------------- |
| Framework            | Next.js 14 (App Router, standard serverless deploy — no custom server) |
| Styling              | Tailwind CSS                              |
| Real-time            | [Pusher Channels](https://pusher.com/channels) — API routes publish, the staff dashboard subscribes |
| Session store         | [Upstash Redis](https://upstash.com) (REST-based, so it works from serverless functions) |
| State                | React hooks                               |

Patient field updates go `browser -> POST /api/patient/update -> Redis` and
are then broadcast over Pusher to every open staff dashboard. There's no
long-lived server process and no in-memory state, so this runs natively on
Vercel. "Idle" status (no typing for ~12s) is derived on the client from a
`lastActivity` timestamp instead of a server-side sweep, since serverless
functions can't run a background timer between requests.

---

## Running locally

```bash
npm install
npm run dev
```

Open two tabs:

- `http://localhost:3000/patient` — fill in the form
- `http://localhost:3000/staff` — watch it update live

Each browser tab that opens `/patient` gets its own session id (stored in
`sessionStorage`), so opening a few patient tabs alongside the staff view is
the fastest way to see the sync working.

Production build:

```bash
npm run build
npm run start
```

---

## Deployment notes (Vercel)

This app runs on plain Next.js API routes — no custom server — so it
deploys on Vercel like any standard Next.js app. It needs two external
services, both with generous free tiers:

1. **Pusher Channels** — real-time push from the server to the staff
   dashboard.
   - Create an app at [dashboard.pusher.com](https://dashboard.pusher.com).
   - From "App Keys" you'll need: `app_id`, `key`, `secret`, `cluster`.

2. **Upstash Redis** — the session store (survives across serverless
   invocations, unlike an in-memory `Map`).
   - Easiest path: in the Vercel dashboard, go to your project ->
     **Storage** -> **Marketplace Database Providers** -> add **Upstash**.
     This sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for
     you automatically.
   - Or create a database directly at
     [console.upstash.com](https://console.upstash.com) and copy the REST
     URL/token yourself.

### Environment variables

Set these in Vercel (Project Settings -> Environment Variables) — see
`.env.example` for the full list:

| Variable | Where it's used |
| --- | --- |
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | server-side, to publish events |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | client-side, to subscribe (must be `NEXT_PUBLIC_` to reach the browser) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | server-side, session storage |

### Steps

```bash
npm i -g vercel   # if you don't have it
vercel login
vercel            # first deploy, links the project
vercel env add PUSHER_APP_ID
vercel env add PUSHER_KEY
vercel env add PUSHER_SECRET
vercel env add PUSHER_CLUSTER
vercel env add NEXT_PUBLIC_PUSHER_KEY
vercel env add NEXT_PUBLIC_PUSHER_CLUSTER
# skip the two UPSTASH_ vars if you used the Marketplace integration above
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel --prod     # deploy with the env vars in place
```

Or connect the GitHub repo at [vercel.com/new](https://vercel.com/new) and
add the same environment variables in the project settings before the first
deploy — either way works.

Locally, copy `.env.example` to `.env.local` and fill in the same values
before running `npm run dev`.

### Other hosts

Render, Railway, Fly.io, or any host running a persistent Node process also
still work fine with this same Pusher/Redis-based code — the API routes and
hooks don't care whether the process is long-lived or serverless.

---

## Bonus features implemented

- **Live "just changed" highlight** — the specific field that was just
  edited briefly highlights on the staff card, not just the card as a whole.
- **Idle detection** — a patient who stops typing for ~12s automatically
  flips from "Filling in" to "Idle" on the staff view (checked server-side,
  not just on the next keystroke).
- **Filter tabs on the staff dashboard** — All / Filling in / Idle /
  Submitted, with live counts.
- **Session resume** — refreshing the patient form keeps the same session
  (via `sessionStorage`), so a page reload doesn't create a duplicate card
  on the staff side.
- **Field-level validation** with inline errors, required/optional labeling,
  and phone/email/date-of-birth format checks.

---

## Project structure

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the full breakdown of
folder structure, design decisions, component architecture, and the
real-time synchronization flow.
