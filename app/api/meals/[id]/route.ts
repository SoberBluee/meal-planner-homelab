import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { mealIngredients, meals } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return handleRoute(
    `PUT /api/meals/${id}`,
    "meal.update",
    async () => {
      const mealId = Number.parseInt(id, 10);

      if (Number.isNaN(mealId)) {
        return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
      }

      const body = (await request.json()) as {
        title?: string;
        price?: number | null;
        ingredients?: Array<{
          name: string;
          quantity?: number | null;
          unit?: string | null;
        }>;
      };

      const title = body.title?.trim();
      if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
      }

      const [existingMeal] = await db
        .select()
        .from(meals)
        .where(eq(meals.id, mealId));

      if (!existingMeal) {
        return NextResponse.json({ error: "Meal not found" }, { status: 404 });
      }

      await db
        .update(meals)
        .set({
          title,
          price: body.price ?? null,
        })
        .where(eq(meals.id, mealId));

      await db.delete(mealIngredients).where(eq(mealIngredients.mealId, mealId));

      const ingredientRows = (body.ingredients ?? [])
        .map((item) => ({
          mealId,
          name: item.name.trim(),
          quantity: item.quantity ?? null,
          unit: item.unit?.trim() || null,
        }))
        .filter((item) => item.name);

      if (ingredientRows.length > 0) {
        await db.insert(mealIngredients).values(ingredientRows);
      }

      await invalidate(CACHE_KEYS.meals);

      const ingredients = await db
        .select()
        .from(mealIngredients)
        .where(eq(mealIngredients.mealId, mealId));

      const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
      if (!meal) {
        return NextResponse.json({ error: "Meal not found" }, { status: 404 });
      }

      logAction({
        action: "meal.update",
        outcome: "success",
        resource: "meal",
        resourceId: mealId,
        summary: `Updated meal "${title}" (${ingredientRows.length} ingredients)`,
        title,
        ingredientCount: ingredientRows.length,
      });

      return NextResponse.json({ ...meal, ingredients });
    },
    request,
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return handleRoute(
    `DELETE /api/meals/${id}`,
    "meal.delete",
    async () => {
      const mealId = Number.parseInt(id, 10);

      if (Number.isNaN(mealId)) {
        return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
      }

      const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));

      if (!meal) {
        return NextResponse.json({ error: "Meal not found" }, { status: 404 });
      }

      await db.delete(meals).where(eq(meals.id, mealId));
      await invalidate(CACHE_KEYS.meals);

      logAction({
        action: "meal.delete",
        outcome: "success",
        resource: "meal",
        resourceId: mealId,
        summary: `Deleted meal "${meal.title}"`,
        title: meal.title,
      });

      return NextResponse.json({ ok: true });
    },
    request,
  );
}
