import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { essentialItems } from "@/lib/schema";

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
    .delete(essentialItems)
    .where(eq(essentialItems.id, itemId))
    .returning();

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
