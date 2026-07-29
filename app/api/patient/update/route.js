import { NextResponse } from "next/server";
import { updateData } from "../../../../lib/realtime/store";
import { publishSessionUpdate } from "../../../../lib/realtime/pusherServer";

export async function POST(req) {
  const { sessionId, data } = await req.json();
  if (!sessionId || !data) {
    return NextResponse.json({ error: "sessionId and data required" }, { status: 400 });
  }
  const session = await updateData(sessionId, data);
  await publishSessionUpdate(session);
  return NextResponse.json(session);
}
