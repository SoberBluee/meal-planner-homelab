import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyPin,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { pin?: string };
  const pin = body.pin?.trim();

  if (!pin || !verifyPin(pin)) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
