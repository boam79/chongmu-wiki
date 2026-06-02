import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Supabase upsert
  return NextResponse.json({ ok: false, message: "Not implemented" }, { status: 501 });
}
