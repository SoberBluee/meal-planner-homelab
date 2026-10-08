import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getPeople } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { people } from "@/lib/schema";

export async function GET(request: Request) {
  return handleRoute(
    "GET /api/people",
    "person.list",
    async () => NextResponse.json(await getPeople()),
    request,
  );
}

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/people",
    "person.create",
    async () => {
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim();
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const existing = await getPeople();
      if (existing.some((person) => person.name.toLowerCase() === name.toLowerCase())) {
        return NextResponse.json({ error: "Person already exists" }, { status: 409 });
      }

      await db.insert(people).values({ name, sortOrder: existing.length });
      await invalidate(CACHE_KEYS.people);
      logAction({
        action: "person.create",
        outcome: "success",
        summary: `Added person "${name}"`,
        name,
      });
      return NextResponse.json(await getPeople(), { status: 201 });
    },
    request,
  );
}
