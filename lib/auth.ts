import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  createSessionToken,
  sessionMaxAgeSeconds,
  verifyPin,
} from "@/lib/session";

export { COOKIE_NAME, verifyPin };

export async function setSessionCookie(): Promise<void> {
  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionMaxAgeSeconds,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
