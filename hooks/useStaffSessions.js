"use client";

import { useEffect, useState } from "react";
import { getSocket } from "../lib/socketClient";

export function useStaffSessions() {
  const [sessions, setSessions] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    function join() {
      socket.emit("staff:join");
      setConnected(true);
    }

    function onInit(list) {
      const map = {};
      for (const s of list) map[s.sessionId] = s;
      setSessions(map);
    }

    function onUpdate(session) {
      setSessions((prev) => ({ ...prev, [session.sessionId]: session }));
    }

    function onDisconnect() {
      setConnected(false);
    }

    if (socket.connected) join();
    socket.on("connect", join);
    socket.on("staff:init", onInit);
    socket.on("staff:patient_update", onUpdate);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", join);
      socket.off("staff:init", onInit);
      socket.off("staff:patient_update", onUpdate);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const list = Object.values(sessions).sort((a, b) => a.createdAt - b.createdAt);

  return { sessions: list, connected };
}
