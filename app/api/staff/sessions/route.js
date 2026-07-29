import { NextResponse } from "next/server";
import { getAll } from "../../../../lib/realtime/store";

export async function GET() {
  const sessions = await getAll();
  return NextResponse.json(sessions);
}
