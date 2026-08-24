import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { essentialItems } from "@/lib/schema";

export async function GET() {
  const items = await db
    .select()
    .from(essentialItems)
    .orderBy(asc(essentialItems.sortOrder), asc(essentialItems.name));

  return NextResponse.json(items);
}

export async function POST(request: Request) {
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

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(request: Request) {
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

  const items = await db
    .select()
    .from(essentialItems)
    .orderBy(asc(essentialItems.sortOrder), asc(essentialItems.name));

  return NextResponse.json(items);
}
