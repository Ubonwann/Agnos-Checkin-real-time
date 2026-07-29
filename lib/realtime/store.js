const { EMPTY_PATIENT_DATA } = require("../fields");

/**
 * sessions: Map<sessionId, {
 *   sessionId, data, status, createdAt, lastActivity, submittedAt
 * }>
 * status: "filling" | "idle" | "submitted" | "left"
 *
 * This is intentionally in-memory. The assignment doesn't call for
 * persistence, and it keeps the demo self-contained. A real deployment
 * would swap this module for Redis (needed anyway once you run more than
 * one server instance, since Socket.io rooms are per-process).
 */
const sessions = new Map();

const INACTIVITY_MS = 12_000; // no keystrokes for this long -> "idle"
const STALE_MS = 30 * 60_000; // drop sessions left untouched this long

function upsertSession(sessionId, initialData = {}) {
  const existing = sessions.get(sessionId);
  const now = Date.now();
  const session = existing || {
    sessionId,
    data: { ...EMPTY_PATIENT_DATA },
    status: "filling",
    createdAt: now,
    submittedAt: null,
  };
  session.data = { ...session.data, ...initialData };
  session.lastActivity = now;
  if (session.status === "left") session.status = "filling";
  sessions.set(sessionId, session);
  return session;
}

function updateData(sessionId, partialData) {
  const session = sessions.get(sessionId) || upsertSession(sessionId);
  session.data = { ...session.data, ...partialData };
  session.lastActivity = Date.now();
  if (session.status !== "submitted") session.status = "filling";
  sessions.set(sessionId, session);
  return session;
}

function markSubmitted(sessionId, finalData) {
  const session = sessions.get(sessionId) || upsertSession(sessionId);
  if (finalData) session.data = { ...session.data, ...finalData };
  session.status = "submitted";
  session.submittedAt = Date.now();
  session.lastActivity = Date.now();
  sessions.set(sessionId, session);
  return session;
}

function markLeft(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (session.status !== "submitted") session.status = "left";
  sessions.set(sessionId, session);
  return session;
}

/** Sweeps for sessions gone idle or stale. Returns changed sessions. */
function sweep() {
  const now = Date.now();
  const changed = [];
  for (const session of sessions.values()) {
    if (
      session.status === "filling" &&
      now - session.lastActivity > INACTIVITY_MS
    ) {
      session.status = "idle";
      changed.push(session);
    }
  }
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActivity > STALE_MS) sessions.delete(id);
  }
  return changed;
}

function getAll() {
  return Array.from(sessions.values());
}

function getOne(sessionId) {
  return sessions.get(sessionId) || null;
}

module.exports = {
  upsertSession,
  updateData,
  markSubmitted,
  markLeft,
  sweep,
  getAll,
  getOne,
  INACTIVITY_MS,
};
