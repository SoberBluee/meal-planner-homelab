import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getPeople } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { people } from "@/lib/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleRoute(
    `PUT /api/people/${id}`,
    "person.rename",
    async () => {
      const personId = Number.parseInt(id, 10);
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim();
      if (Number.isNaN(personId) || !name) {
        return NextResponse.json({ error: "Valid person and name are required" }, { status: 400 });
      }

      const existing = await getPeople();
      if (!existing.some((person) => person.id === personId)) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }
      if (
        existing.some(
          (person) => person.id !== personId && person.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        return NextResponse.json({ error: "Person already exists" }, { status: 409 });
      }

      await db.update(people).set({ name }).where(eq(people.id, personId));
      await invalidate(CACHE_KEYS.people);
      logAction({
        action: "person.rename",
        outcome: "success",
        resource: "person",
        resourceId: personId,
        summary: `Renamed person to "${name}"`,
      });
      return NextResponse.json(await getPeople());
    },
    request,
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleRoute(
    `DELETE /api/people/${id}`,
    "person.delete",
    async () => {
      const personId = Number.parseInt(id, 10);
      if (Number.isNaN(personId)) {
        return NextResponse.json({ error: "Invalid person id" }, { status: 400 });
      }
      const existing = await getPeople();
      const person = existing.find((item) => item.id === personId);
      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      await db.delete(people).where(eq(people.id, personId));
      await invalidate(CACHE_KEYS.people);
      logAction({
        action: "person.delete",
        outcome: "success",
        resource: "person",
        resourceId: personId,
        summary: `Deleted person "${person.name}"`,
      });
      return NextResponse.json(await getPeople());
    },
    request,
  );
}
