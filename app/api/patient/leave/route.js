import { NextResponse } from "next/server";
import { markLeft } from "../../../../lib/realtime/store";
import { publishSessionUpdate } from "../../../../lib/realtime/pusherServer";

// sendBeacon doesn't reliably set an application/json content-type, so read
// the raw body and parse it manually instead of relying on req.json().
export async function POST(req) {
  let sessionId;
  try {
    const raw = await req.text();
    sessionId = JSON.parse(raw)?.sessionId;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const session = await markLeft(sessionId);
  if (session) await publishSessionUpdate(session);
  return NextResponse.json({ ok: true });
}
