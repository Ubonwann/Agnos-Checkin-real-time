"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getSocket } from "../lib/socketClient";
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

export function usePatientSession() {
  const [sessionId, setSessionId] = useState(null);
  const [data, setData] = useState(EMPTY_PATIENT_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [connected, setConnected] = useState(false);
  const pendingRef = useRef(null);
  const throttleTimer = useRef(null);

  useEffect(() => {
    setSessionId(readOrCreateSessionId());
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();

    function join() {
      socket.emit("patient:join", { sessionId, data: {} });
      setConnected(true);
    }

    if (socket.connected) join();
    socket.on("connect", join);
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.off("connect", join);
    };
  }, [sessionId]);

  function flush() {
    if (!pendingRef.current || !sessionId) return;
    const socket = getSocket();
    socket.emit("patient:update", { sessionId, data: pendingRef.current });
    pendingRef.current = null;
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
    const socket = getSocket();
    socket.emit("patient:submit", { sessionId, data });
    setSubmitted(true);
  }

  return useMemo(
    () => ({ sessionId, data, setField, submit, submitted, connected }),
    [sessionId, data, submitted, connected]
  );
}
