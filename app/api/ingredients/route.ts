import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getIngredients, getShopLayout } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients } from "@/lib/schema";

export async function GET(request: Request) {
  return handleRoute(
    "GET /api/ingredients",
    "ingredient.list",
    async () => {
      const data = await getIngredients();
      logAction({
        action: "ingredient.list",
        outcome: "success",
        summary: `Listed ${data.length} ingredients`,
        ingredientCount: data.length,
      });
      return NextResponse.json(data);
    },
    request,
  );
}

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/ingredients",
    "ingredient.create",
    async () => {
      const body = (await request.json()) as {
        name?: string;
        category?: string;
        printName?: string;
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

      const existing = await db.select().from(ingredients);
      const maxOrder = existing
        .filter((item) => item.category === category)
        .reduce(
        (max, item) => Math.max(max, item.sortOrder),
        -1,
      );

      const inserted = await db
        .insert(ingredients)
        .values({
          name,
          category,
          printName: body.printName?.trim() || name,
          price: body.price ?? null,
          sortOrder: maxOrder + 1,
        })
        .$returningId();

      await invalidate(CACHE_KEYS.ingredients, CACHE_KEYS.shopLayout);

      const itemId = inserted[0]?.id;
      if (!itemId) {
        return NextResponse.json(
          { error: "Could not create ingredient" },
          { status: 500 },
        );
      }

      const [item] = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.id, itemId));

      if (!item) {
        return NextResponse.json(
          { error: "Could not load created ingredient" },
          { status: 500 },
        );
      }

      logAction({
        action: "ingredient.create",
        outcome: "success",
        resource: "ingredient",
        resourceId: item.id,
        summary: `Added ingredient "${name}" (${category})`,
        name,
        category,
      });

      return NextResponse.json(item, { status: 201 });
    },
    request,
  );
}
