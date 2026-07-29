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
| Framework            | Next.js 14 (App Router)                   |
| Styling              | Tailwind CSS                              |
| Real-time            | Socket.io (server attached to a custom Node HTTP server) |
| State                | React hooks, in-memory server-side store  |

No database is used — session data lives in server memory, which is enough
for a live intake queue and keeps the assignment self-contained. See
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the reasoning and how you'd
swap in persistence.

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

## Deployment notes

This app uses a **custom Node server** (`server.js`) that runs Next.js and
Socket.io together on one long-lived HTTP server. That matters for hosting:

- **Works well:** Render, Railway, Heroku, Fly.io, a VM, or any host that
  runs a persistent Node process. These are the recommended targets — set
  the start command to `npm run build && npm run start`.
- **Vercel:** Vercel's functions are serverless/short-lived and don't hold
  persistent WebSocket connections or a shared in-memory store across
  invocations, so the custom server as written won't behave correctly there.
  To deploy on Vercel specifically, swap the transport for something built
  for serverless (Socket.io's Redis adapter + a separate always-on socket
  host, or a managed real-time service like Pusher/Ably), or fall back to
  Socket.io's long-polling only. That swap is isolated to
  `lib/realtime/socketServer.js` and `lib/socketClient.js` — nothing in the
  UI layer needs to change.

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
