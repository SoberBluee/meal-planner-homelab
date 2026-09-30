import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getEssentials } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { essentialItems } from "@/lib/schema";

export async function GET(request: Request) {
  return handleRoute(
    "GET /api/essentials",
    "essential.list",
    async () => {
      const data = await getEssentials();
      logAction({
        action: "essential.list",
        outcome: "success",
        summary: `Listed ${data.length} essentials`,
        essentialCount: data.length,
      });
      return NextResponse.json(data);
    },
    request,
  );
}

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/essentials",
    "essential.create",
    async () => {
      const body = (await request.json()) as { name?: string };

      const name = body.name?.trim();
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const existing = await db.select().from(essentialItems);
      const maxOrder = existing.reduce(
        (max, item) => Math.max(max, item.sortOrder),
        -1,
      );

      const inserted = await db
        .insert(essentialItems)
        .values({
          name,
          sortOrder: maxOrder + 1,
        })
        .$returningId();

      await invalidate(CACHE_KEYS.essentials);

      const itemId = inserted[0]?.id;
      if (!itemId) {
        return NextResponse.json(
          { error: "Could not create item" },
          { status: 500 },
        );
      }

      const [item] = await db
        .select()
        .from(essentialItems)
        .where(eq(essentialItems.id, itemId));

      if (!item) {
        return NextResponse.json(
          { error: "Could not load created item" },
          { status: 500 },
        );
      }

      logAction({
        action: "essential.create",
        outcome: "success",
        resource: "essential",
        resourceId: item.id,
        summary: `Added essential "${name}"`,
        name,
      });

      return NextResponse.json(item, { status: 201 });
    },
    request,
  );
}

export async function PUT(request: Request) {
  return handleRoute(
    "PUT /api/essentials",
    "essential.reorder",
    async () => {
      const body = (await request.json()) as {
        items?: Array<{ id: number; name: string; sortOrder: number }>;
      };

      if (!body.items) {
        return NextResponse.json({ error: "Items required" }, { status: 400 });
      }

      for (const item of body.items) {
        await db
          .update(essentialItems)
          .set({
            name: item.name.trim(),
            sortOrder: item.sortOrder,
          })
          .where(eq(essentialItems.id, item.id));
      }

      await invalidate(CACHE_KEYS.essentials);

      logAction({
        action: "essential.reorder",
        outcome: "success",
        summary: `Reordered ${body.items.length} essentials`,
        itemCount: body.items.length,
      });

      return NextResponse.json(await getEssentials());
    },
    request,
  );
}
