"use client";

import { useEffect, useRef, useState } from "react";
import { getPusherClient, STAFF_CHANNEL, UPDATE_EVENT } from "../lib/pusherClient";

const INACTIVITY_MS = 12_000; // no updates for this long -> show as "idle"

function deriveStatus(session) {
  if (session.status === "filling" && Date.now() - session.lastActivity > INACTIVITY_MS) {
    return "idle";
  }
  return session.status;
}

export function useStaffSessions() {
  const [sessions, setSessions] = useState([]);
  const [connected, setConnected] = useState(false);
  // Raw (server) sessions, keyed by id. Display state is derived from this
  // on every render/tick, since "idle" is no longer pushed by the server.
  const rawRef = useRef({});

  function commit() {
    const list = Object.values(rawRef.current)
      .map((s) => ({ ...s, status: deriveStatus(s) }))
      .sort((a, b) => a.createdAt - b.createdAt);
    setSessions(list);
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/staff/sessions")
      .then((res) => res.json())
      .then((list) => {
        if (cancelled) return;
        const map = {};
        for (const s of list) map[s.sessionId] = s;
        rawRef.current = map;
        commit();
      })
      .catch(() => {});

    const pusher = getPusherClient();
    const channel = pusher.subscribe(STAFF_CHANNEL);

    function onSubscribed() {
      setConnected(true);
    }
    function onError() {
      setConnected(false);
    }
    function onUpdate(session) {
      rawRef.current = { ...rawRef.current, [session.sessionId]: session };
      commit();
    }

    channel.bind("pusher:subscription_succeeded", onSubscribed);
    channel.bind("pusher:subscription_error", onError);
    channel.bind(UPDATE_EVENT, onUpdate);

    // Nothing pushes "idle" transitions anymore, so re-derive display status
    // once a second purely from lastActivity, without hitting the network.
    const tick = setInterval(commit, 1000);

    return () => {
      cancelled = true;
      clearInterval(tick);
      channel.unbind_all();
      pusher.unsubscribe(STAFF_CHANNEL);
    };
  }, []);

  return { sessions, connected };
}
