export const COOKIE_NAME = "meal_planner_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.AUTH_SECRET || "dev-secret-change-me";
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function verifyPin(pin: string): boolean {
  const appPin = process.env.APP_PIN || "1234";
  return pin === appPin;
}

export async function createSessionToken(): Promise<string> {
  const expires = Date.now() + SESSION_MS;
  const payload = `authenticated:${expires}`;
  const sig = await hmacSha256(getSecret(), payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expected = await hmacSha256(getSecret(), payload);
  if (sig !== expected) return false;

  const [, expiresStr] = payload.split(":");
  const expires = Number.parseInt(expiresStr, 10);
  if (Number.isNaN(expires)) return false;

  return Date.now() < expires;
}

export const sessionMaxAgeSeconds = SESSION_MS / 1000;
