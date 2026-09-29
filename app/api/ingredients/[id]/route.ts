import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const itemId = Number.parseInt(id, 10);

  if (Number.isNaN(itemId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [item] = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.id, itemId));

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await db.delete(ingredients).where(eq(ingredients.id, itemId));
  await invalidate(CACHE_KEYS.ingredients);

  return NextResponse.json({ ok: true });
}
