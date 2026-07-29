const { Redis } = require("@upstash/redis");
const { EMPTY_PATIENT_DATA } = require("../fields");

/**
 * sessions live in a single Redis hash: agnos:sessions -> { [sessionId]: session }
 * status: "filling" | "idle" | "submitted" | "left"
 *
 * Why Redis instead of the in-memory Map this used to be: on Vercel each
 * request can be handled by a different, short-lived serverless
 * invocation, so anything kept in process memory would not be visible to
 * the next request. Upstash's Redis is REST-based (no persistent TCP
 * connection required), which is exactly what serverless functions need.
 *
 * "Idle" used to be flipped by a server-side setInterval sweep. Serverless
 * functions can't run a background timer between requests, so idle status
 * is now derived on the client from `lastActivity` instead (see
 * hooks/useStaffSessions.js) — the store here just records lastActivity.
 */
const redis = Redis.fromEnv();
const SESSIONS_KEY = "agnos:sessions";
const STALE_MS = 30 * 60_000; // drop sessions untouched this long

async function getOne(sessionId) {
  const raw = await redis.hget(SESSIONS_KEY, sessionId);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

async function save(session) {
  await redis.hset(SESSIONS_KEY, { [session.sessionId]: session });
  return session;
}

async function upsertSession(sessionId, initialData = {}) {
  const existing = await getOne(sessionId);
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
  return save(session);
}

async function updateData(sessionId, partialData) {
  const session = (await getOne(sessionId)) || (await upsertSession(sessionId));
  session.data = { ...session.data, ...partialData };
  session.lastActivity = Date.now();
  if (session.status !== "submitted") session.status = "filling";
  return save(session);
}

async function markSubmitted(sessionId, finalData) {
  const session = (await getOne(sessionId)) || (await upsertSession(sessionId));
  if (finalData) session.data = { ...session.data, ...finalData };
  session.status = "submitted";
  session.submittedAt = Date.now();
  session.lastActivity = Date.now();
  return save(session);
}

async function markLeft(sessionId) {
  const session = await getOne(sessionId);
  if (!session) return null;
  if (session.status !== "submitted") session.status = "left";
  session.lastActivity = Date.now();
  return save(session);
}

/** Returns all sessions, quietly dropping (and deleting) stale ones. */
async function getAll() {
  const raw = await redis.hgetall(SESSIONS_KEY);
  if (!raw) return [];
  const now = Date.now();
  const sessions = [];
  const staleIds = [];
  for (const [id, value] of Object.entries(raw)) {
    const session = typeof value === "string" ? JSON.parse(value) : value;
    if (now - session.lastActivity > STALE_MS) {
      staleIds.push(id);
    } else {
      sessions.push(session);
    }
  }
  if (staleIds.length) {
    // Best-effort cleanup; don't block the response on it.
    redis.hdel(SESSIONS_KEY, ...staleIds).catch(() => {});
  }
  return sessions;
}

module.exports = {
  upsertSession,
  updateData,
  markSubmitted,
  markLeft,
  getAll,
  getOne,
};
