"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { EMPTY_PATIENT_DATA } from "../lib/fields";

const STORAGE_KEY = "agnos:sessionId";
const UPDATE_THROTTLE_MS = 200;

function readOrCreateSessionId() {
  if (typeof window === "undefined") return null;
  let id = window.sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    window.sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request to ${path} failed`);
  return res.json();
}

export function usePatientSession() {
  const [sessionId, setSessionId] = useState(null);
  const [data, setData] = useState(EMPTY_PATIENT_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [connected, setConnected] = useState(false);
  const pendingRef = useRef(null);
  const throttleTimer = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    setSessionId(readOrCreateSessionId());
  }, []);

  // Join (or resume) the session on mount, and tell the server we've left
  // if the tab closes or navigates away — this replaces the socket.io
  // "disconnect" event, which doesn't exist once there's no persistent
  // connection to lose.
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    post("/api/patient/join", { sessionId, data: {} })
      .then(() => {
        if (!cancelled) setConnected(true);
      })
      .catch(() => {
        if (!cancelled) setConnected(false);
      });

    function handleLeave() {
      const payload = JSON.stringify({ sessionId });
      navigator.sendBeacon?.(
        "/api/patient/leave",
        new Blob([payload], { type: "application/json" })
      );
    }

    window.addEventListener("pagehide", handleLeave);
    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", handleLeave);
    };
  }, [sessionId]);

  function flush() {
    if (!pendingRef.current || !sessionId) return;
    const payload = pendingRef.current;
    pendingRef.current = null;
    post("/api/patient/update", { sessionId, data: payload }).catch(() => {
      setConnected(false);
    });
  }

  function setField(fieldId, value) {
    setData((prev) => ({ ...prev, [fieldId]: value }));
    pendingRef.current = { ...(pendingRef.current || {}), [fieldId]: value };

    if (throttleTimer.current) return;
    throttleTimer.current = setTimeout(() => {
      flush();
      throttleTimer.current = null;
    }, UPDATE_THROTTLE_MS);
  }

  function submit() {
    if (!sessionId) return;
    flush();
    if (throttleTimer.current) {
      clearTimeout(throttleTimer.current);
      throttleTimer.current = null;
    }
    post("/api/patient/submit", { sessionId, data: dataRef.current }).catch(() => {});
    setSubmitted(true);
  }

  return useMemo(
    () => ({ sessionId, data, setField, submit, submitted, connected }),
    [sessionId, data, submitted, connected]
  );
}
