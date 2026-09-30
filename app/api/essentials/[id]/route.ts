import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { essentialItems } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return handleRoute(
    `DELETE /api/essentials/${id}`,
    "essential.delete",
    async () => {
      const itemId = Number.parseInt(id, 10);

      if (Number.isNaN(itemId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const [item] = await db
        .select()
        .from(essentialItems)
        .where(eq(essentialItems.id, itemId));

      if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      await db.delete(essentialItems).where(eq(essentialItems.id, itemId));
      await invalidate(CACHE_KEYS.essentials);

      logAction({
        action: "essential.delete",
        outcome: "success",
        resource: "essential",
        resourceId: itemId,
        summary: `Deleted essential "${item.name}"`,
        name: item.name,
      });

      return NextResponse.json({ ok: true });
    },
    request,
  );
}
