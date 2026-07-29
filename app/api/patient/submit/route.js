import { NextResponse } from "next/server";
import { markSubmitted } from "../../../../lib/realtime/store";
import { publishSessionUpdate } from "../../../../lib/realtime/pusherServer";

export async function POST(req) {
  const { sessionId, data } = await req.json();
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  const session = await markSubmitted(sessionId, data);
  await publishSessionUpdate(session);
  return NextResponse.json(session);
}
