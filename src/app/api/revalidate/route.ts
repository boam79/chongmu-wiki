import { NextResponse } from "next/server";

export async function POST() {
  // TODO: ISR 캐시 갱신
  return NextResponse.json({ ok: false, message: "Not implemented" }, { status: 501 });
}
