import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyPin,
} from "@/lib/auth";
import { logAction } from "@/lib/logger";

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/auth",
    "auth.login",
    async () => {
      const body = (await request.json()) as { pin?: string };
      const pin = body.pin?.trim();

      if (!pin || !verifyPin(pin)) {
        logAction(
          {
            action: "auth.login",
            outcome: "denied",
            summary: "Invalid PIN login attempt",
          },
          "warn",
        );
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
      }

      await setSessionCookie();
      logAction({
        action: "auth.login",
        outcome: "success",
        summary: "User signed in with PIN",
      });
      return NextResponse.json({ ok: true });
    },
    request,
  );
}

export async function DELETE(request: Request) {
  return handleRoute(
    "DELETE /api/auth",
    "auth.logout",
    async () => {
      await clearSessionCookie();
      logAction({
        action: "auth.logout",
        outcome: "success",
        summary: "User signed out",
      });
      return NextResponse.json({ ok: true });
    },
    request,
  );
}
