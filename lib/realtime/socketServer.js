const { Server } = require("socket.io");
const store = require("./store");

const STAFF_ROOM = "staff";
const SWEEP_INTERVAL_MS = 4_000;

function attachRealtime(httpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    // --- Staff dashboard joins the broadcast room and gets a snapshot ---
    socket.on("staff:join", () => {
      socket.data.role = "staff";
      socket.join(STAFF_ROOM);
      socket.emit("staff:init", store.getAll());
    });

    // --- Patient identifies their session (new or resumed) ---
    socket.on("patient:join", ({ sessionId, data } = {}) => {
      if (!sessionId) return;
      socket.data.role = "patient";
      socket.data.sessionId = sessionId;
      socket.join(sessionId);
      const session = store.upsertSession(sessionId, data);
      io.to(STAFF_ROOM).emit("staff:patient_update", session);
    });

    // --- Patient edits a field (fired on every change, lightly throttled client-side) ---
    socket.on("patient:update", ({ sessionId, data } = {}) => {
      if (!sessionId || !data) return;
      const session = store.updateData(sessionId, data);
      io.to(STAFF_ROOM).emit("staff:patient_update", session);
    });

    // --- Patient submits the form ---
    socket.on("patient:submit", ({ sessionId, data } = {}) => {
      if (!sessionId) return;
      const session = store.markSubmitted(sessionId, data);
      io.to(STAFF_ROOM).emit("staff:patient_update", session);
    });

    socket.on("disconnect", () => {
      if (socket.data.role === "patient" && socket.data.sessionId) {
        const session = store.markLeft(socket.data.sessionId);
        if (session) io.to(STAFF_ROOM).emit("staff:patient_update", session);
      }
    });
  });

  // Periodically flip "filling" -> "idle" once a patient stops typing, and
  // let the staff view know without waiting for the next edit.
  setInterval(() => {
    const changed = store.sweep();
    for (const session of changed) {
      io.to(STAFF_ROOM).emit("staff:patient_update", session);
    }
  }, SWEEP_INTERVAL_MS);

  return io;
}

module.exports = { attachRealtime };
