# Development Planning

## 1. Project structure

```
agnos-patient-system/
├── server.js                     # Custom Node server: boots Next.js + attaches Socket.io
├── app/
│   ├── layout.js                 # Root layout, loads fonts, sets global background/text color
│   ├── globals.css               # Tailwind directives + a few base rules (focus ring, reduced motion)
│   ├── page.js                   # Landing page (links to /patient and /staff)
│   ├── patient/page.js           # Patient route — renders <PatientForm />
│   └── staff/page.js             # Staff dashboard route — live grid of patient cards
├── components/
│   ├── patient/
│   │   ├── PatientForm.jsx       # Grouped form, validation wiring, submit + success state
│   │   └── FormField.jsx         # Renders text/select/date/tel/email/textarea from a field def
│   └── staff/
│       ├── PatientCard.jsx       # One patient's live data + "just changed" flash highlight
│       └── StatusBadge.jsx       # Filling in / Idle / Submitted / Left, with the pulse dot
├── hooks/
│   ├── usePatientSession.js      # Session id, form state, throttled socket emits
│   └── useStaffSessions.js       # Joins the staff room, keeps a live map of all sessions
├── lib/
│   ├── fields.js                 # Single source of truth for form fields (id/label/type/group/required)
│   ├── validation.js             # validateField / validateAll, built from lib/fields.js
│   ├── socketClient.js           # Shared Socket.io client singleton (browser side)
│   └── realtime/
│       ├── store.js              # In-memory session store (server side)
│       └── socketServer.js       # Socket.io event handlers, wires store <-> broadcasts
├── tailwind.config.js            # Design tokens (colors, fonts, pulse/sweep keyframes)
└── docs/DEVELOPMENT.md           # This file
```

**Why a custom server instead of plain `next dev`/API routes?** Socket.io
needs a raw HTTP server to attach to and upgrade connections on. Next's App
Router doesn't expose that server directly, so `server.js` creates one,
hands page requests to Next's request handler, and gives Socket.io the same
server instance. Everything else about the app (routing, React Server
Components, styling) is unmodified Next.js.

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
  and the socket protocol from the patient's side: it creates/reads the
  session id, throttles outgoing `patient:update` events (200ms) so fast
  typing doesn't flood the socket, and exposes a plain `setField`/`submit`
  API to the form.
- **`useStaffSessions.js`** is the mirror on the staff side: joins the
  `staff` room, receives the initial snapshot, and folds incoming
  `staff:patient_update` events into a `{ sessionId: session }` map that
  the dashboard renders as a sorted list.
- **`PatientCard.jsx`** diffs the incoming data against the previous
  render (via a ref) to briefly highlight only the field that changed,
  rather than flashing the whole card on every keystroke.
- **`StatusBadge.jsx`** is presentation-only, mapping a status string to a
  label/color/pulse — kept separate so status styling can change without
  touching card layout.

## 4. Real-time synchronization flow

Transport: **Socket.io**, one shared server instance created in
`server.js` and configured in `lib/realtime/socketServer.js`. Session data
lives in `lib/realtime/store.js`, a `Map` keyed by session id — no
database, since the store only needs to survive the process, not a
restart.

**Patient side**

1. On mount, `usePatientSession` reads (or creates) a `sessionId` from
   `sessionStorage` and emits `patient:join` once the socket connects.
2. Every keystroke updates local React state immediately (so typing never
   feels laggy) and queues the change. Queued changes are flushed as a
   single `patient:update` event at most every 200ms — a light throttle,
   not a debounce, so the staff view still updates *while* the patient is
   typing rather than only after they pause.
3. On submit, any pending update is flushed immediately, then a
   `patient:submit` event is sent with the full record.

**Server side**

4. `store.js` merges incoming data into the session, stamps
   `lastActivity`, and sets `status: "filling"` (or `"submitted"` on
   submit). `socketServer.js` then re-broadcasts the updated session to
   everyone in the `staff` room via `staff:patient_update`.
5. A 4-second sweep interval checks every in-progress session: if
   `lastActivity` is more than ~12s old, status flips to `"idle"` and that
   change is broadcast too — so a patient view flips to idle even without
   a new keystroke to trigger it.
6. On socket disconnect, an unsubmitted session is marked `"left"` (a
   dropped tab or connection), which the staff dashboard filters out of
   its default view.

**Staff side**

7. `useStaffSessions` joins the `staff` room and receives `staff:init`
   (a full snapshot of current sessions) once, then applies every
   subsequent `staff:patient_update` as an in-place update to its local
   map — no polling, no manual refresh.

```
Patient types  ──▶ usePatientSession (throttle 200ms) ──▶ patient:update
                                                                │
                                                                ▼
                                              lib/realtime/store.js (merge + stamp)
                                                                │
                                                                ▼
                                          io.to("staff").emit(staff:patient_update)
                                                                │
                                                                ▼
                                    useStaffSessions ──▶ PatientCard re-renders
```
