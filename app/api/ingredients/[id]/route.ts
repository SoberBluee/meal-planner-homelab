import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getShopLayout } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients, mealIngredients } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return handleRoute(
    `PUT /api/ingredients/${id}`,
    "ingredient.update",
    async () => {
      const itemId = Number.parseInt(id, 10);

      if (Number.isNaN(itemId)) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const body = (await request.json()) as {
        name?: string;
        category?: string;
        price?: number | null;
      };

      const name = body.name?.trim();
      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const category = body.category?.trim();
      const layout = await getShopLayout();
      if (!category || !layout.sections.some((section) => section.name === category)) {
        return NextResponse.json({ error: "Category is required" }, { status: 400 });
      }

      const price = body.price ?? null;
      if (price != null && (!Number.isFinite(price) || price < 0)) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }

      const [existing] = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, itemId));

      if (!existing) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      let sortOrder = existing.sortOrder;
      if (category !== existing.category) {
        const sameCategory = await db
          .select()
          .from(ingredients)
          .where(eq(ingredients.category, category));
        sortOrder =
          sameCategory.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
      }

      const renamed = name !== existing.name;

      await db
        .update(ingredients)
        .set({
          name,
          category,
          price,
          sortOrder,
          printName: existing.printName === existing.name ? name : existing.printName,
        })
        .where(eq(ingredients.id, itemId));

      if (renamed) {
        await db
          .update(mealIngredients)
          .set({ name })
          .where(eq(mealIngredients.name, existing.name));
      }

      await invalidate(
        CACHE_KEYS.ingredients,
        CACHE_KEYS.shopLayout,
        ...(renamed ? [CACHE_KEYS.meals] : []),
      );

      const [item] = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, itemId));

      logAction({
        action: "ingredient.update",
        outcome: "success",
        resource: "ingredient",
        resourceId: itemId,
        summary: renamed
          ? `Updated ingredient "${existing.name}" → "${name}" (${category})`
          : `Updated ingredient "${name}" (${category})`,
        name,
        category,
      });

      return NextResponse.json(item);
    },
    request,
  );
}

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
