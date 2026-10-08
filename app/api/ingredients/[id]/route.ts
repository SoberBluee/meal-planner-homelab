import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return handleRoute(
    `DELETE /api/ingredients/${id}`,
    "ingredient.delete",
    async () => {
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
      await invalidate(CACHE_KEYS.ingredients, CACHE_KEYS.shopLayout);

      logAction({
        action: "ingredient.delete",
        outcome: "success",
        resource: "ingredient",
        resourceId: itemId,
        summary: `Deleted ingredient "${item.name}"`,
        name: item.name,
      });

      return NextResponse.json({ ok: true });
    },
    request,
  );
}
