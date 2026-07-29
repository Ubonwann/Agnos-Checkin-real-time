"use client";

import PusherClient from "pusher-js";

export const STAFF_CHANNEL = "staff-dashboard";
export const UPDATE_EVENT = "patient-update";

let client;

/** Returns a shared Pusher client instance, creating it on first call. */
export function getPusherClient() {
  if (!client) {
    client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
  }
  return client;
}
