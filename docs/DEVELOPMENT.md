# Development Planning

## 1. Project structure

```
agnos-patient-system/
├── app/
│   ├── layout.js                 # Root layout, loads fonts, sets global background/text color
│   ├── globals.css               # Tailwind directives + a few base rules (focus ring, reduced motion)
│   ├── page.js                   # Landing page (links to /patient and /staff)
│   ├── patient/page.js           # Patient route — renders <PatientForm />
│   ├── staff/page.js             # Staff dashboard route — live grid of patient cards
│   └── api/
│       ├── patient/
│       │   ├── join/route.js     # POST — create/resume a session
│       │   ├── update/route.js   # POST — merge a field-level update
│       │   ├── submit/route.js   # POST — mark a session submitted
│       │   └── leave/route.js    # POST — mark a session left (sent via sendBeacon)
│       └── staff/sessions/route.js # GET — initial snapshot for the dashboard
├── components/
│   ├── patient/
│   │   ├── PatientForm.jsx       # Grouped form, validation wiring, submit + success state
│   │   └── FormField.jsx         # Renders text/select/date/tel/email/textarea from a field def
│   └── staff/
│       ├── PatientCard.jsx       # One patient's live data + "just changed" flash highlight
│       └── StatusBadge.jsx       # Filling in / Idle / Submitted / Left, with the pulse dot
├── hooks/
│   ├── usePatientSession.js      # Session id, form state, throttled POSTs to the API routes
│   └── useStaffSessions.js       # Initial fetch + Pusher subscription, keeps a live map of all sessions
├── lib/
│   ├── fields.js                 # Single source of truth for form fields (id/label/type/group/required)
│   ├── validation.js             # validateField / validateAll, built from lib/fields.js
│   ├── pusherClient.js           # Shared Pusher client singleton (browser side)
│   └── realtime/
│       ├── store.js              # Upstash Redis-backed session store (server side)
│       └── pusherServer.js       # Publishes session updates to the staff channel
├── tailwind.config.js            # Design tokens (colors, fonts, pulse/sweep keyframes)
└── docs/DEVELOPMENT.md           # This file
```

**Why API routes + Pusher instead of a custom Socket.io server?** The app
originally ran a custom Node server so Socket.io could hold long-lived
WebSocket connections. That doesn't work on Vercel, where functions are
short-lived and don't share memory across invocations. This version uses
plain Next.js API routes for writes, [Upstash Redis](https://upstash.com)
(REST-based, so no persistent connection needed) as the shared store, and
[Pusher Channels](https://pusher.com/channels) as a managed pub/sub layer
for the server -> staff-dashboard push. The result deploys on Vercel like
any ordinary Next.js app — see the README's deployment section for setup.

## 2. Design

The brief is a clinical intake flow, so the direction leans calm and
legible rather than decorative: a warm paper background, a deep pine/teal
as the primary action color, and a muted clay accent used sparingly for
things that need attention (validation errors, the "patient" path on the
homepage). Fraunces (an editorial serif) is used only for headings, in
italic, to keep a human tone against otherwise plain, dense form UI set in
Inter. IBM Plex Mono is reserved for session ids, timestamps, and other
"system" data — a small typographic cue that separates *what the patient
typed* from *what the system recorded*.

The one recurring visual idea is a **pulse**: the "Filling in" status on
the staff dashboard uses an animating dot styled after a heartbeat monitor,
echoing the fact that this is a live vital-signs-style view of patient
activity, not a static list. It's used exactly once as the signature
element and kept quiet everywhere else.

**Responsiveness:**
- Patient form: fields are single-column on mobile, two-column (label
  above input) from `sm:` up, with the address field always spanning both
  columns. Group `<fieldset>`s stack vertically at all sizes so the form
  reads as a short, scannable list on a phone.
- Staff dashboard: patient cards are a single column on mobile, 2 columns
  at `sm:`, 3 columns at `lg:`. Filter tabs wrap on narrow screens instead
  of scrolling horizontally.
- Both views use `focus-visible` outlines and respect
  `prefers-reduced-motion` (the pulse/flash animations are disabled).

## 3. Component architecture

- **`lib/fields.js` is the schema.** Every field (id, label, input type,
  group, required/optional, options for selects) is defined once. Both
  `FormField.jsx` (rendering inputs) and `PatientCard.jsx` (rendering the
  read-only live view) map over the same array, so adding, renaming, or
  reordering a field only requires editing one file.
- **`FormField.jsx`** is a dumb renderer: given a field definition and a
  value, it picks the right input type and shows/hides its own error text.
  It has no knowledge of the rest of the form.
- **`PatientForm.jsx`** owns form-level state: touched fields, per-field
  errors (via `lib/validation.js`), and submit handling. It delegates the
  actual "talk to the server" concerns to `usePatientSession`.
- **`usePatientSession.js`** is the only place that knows about session ids
  and the API routes from the patient's side: it creates/reads the session
  id, throttles outgoing `POST /api/patient/update` calls (200ms) so fast
  typing doesn't flood the network, and exposes a plain `setField`/`submit`
  API to the form.
- **`useStaffSessions.js`** is the mirror on the staff side: fetches the
  initial snapshot from `GET /api/staff/sessions`, subscribes to the Pusher
  `staff-dashboard` channel, and folds incoming `patient-update` events into
  a `{ sessionId: session }` map that the dashboard renders as a sorted
  list.
- **`PatientCard.jsx`** diffs the incoming data against the previous
  render (via a ref) to briefly highlight only the field that changed,
  rather than flashing the whole card on every keystroke.
- **`StatusBadge.jsx`** is presentation-only, mapping a status string to a
  label/color/pulse — kept separate so status styling can change without
  touching card layout.

## 4. Real-time synchronization flow

Transport: **Pusher Channels** for server -> browser push, plain **fetch**
for browser -> server writes. Session data lives in `lib/realtime/store.js`,
an Upstash Redis hash keyed by session id — REST-based, so it's reachable
from stateless serverless functions and survives across invocations.

**Patient side**

1. On mount, `usePatientSession` reads (or creates) a `sessionId` from
   `sessionStorage` and `POST`s it to `/api/patient/join`.
2. Every keystroke updates local React state immediately (so typing never
   feels laggy) and queues the change. Queued changes are flushed as a
   single `POST /api/patient/update` at most every 200ms — a light
   throttle, not a debounce, so the staff view still updates *while* the
   patient is typing rather than only after they pause.
3. On submit, any pending update is flushed immediately, then
   `POST /api/patient/submit` is sent with the full record.
4. On tab close/navigation, a `pagehide` listener fires
   `navigator.sendBeacon("/api/patient/leave", ...)` — the closest
   serverless equivalent of a socket "disconnect" event.

**Server side**

5. Each API route merges incoming data into the session via `store.js`
   (stamping `lastActivity`, setting `status: "filling"` / `"submitted"` /
   `"left"` as appropriate), then calls `pusherServer.js`'s
   `publishSessionUpdate`, which triggers a `patient-update` event on the
   `staff-dashboard` Pusher channel.
6. There's no server-side sweep interval (serverless functions can't run a
   background timer between requests), so `"idle"` isn't a stored status —
   it's derived. `store.js` just keeps `lastActivity` up to date on every
   write.

**Staff side**

7. `useStaffSessions` fetches `GET /api/staff/sessions` once for the
   initial snapshot, then subscribes to the `staff-dashboard` Pusher
   channel and applies every `patient-update` event as an in-place update
   to its local map.
8. A 1-second local interval re-derives each session's *displayed* status
   from `lastActivity` (flipping `"filling"` -> `"idle"` after ~12s) purely
   client-side — no network call, so a patient going idle shows up on the
   staff view even without a new event to trigger it.

```
Patient types  ──▶ usePatientSession (throttle 200ms) ──▶ POST /api/patient/update
                                                                │
                                                                ▼
                                              lib/realtime/store.js (Upstash: merge + stamp)
                                                                │
                                                                ▼
                                        pusherServer.js: trigger("staff-dashboard", "patient-update")
                                                                │
                                                                ▼
                                    useStaffSessions ──▶ PatientCard re-renders
                                        (+ 1s local tick derives idle/left display state)
```
