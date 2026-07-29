"use client";

import { io } from "socket.io-client";

let socket;

/** Returns a shared Socket.io client instance, creating it on first call. */
export function getSocket() {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      autoConnect: true,
    });
  }
  return socket;
}
