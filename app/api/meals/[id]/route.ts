import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mealIngredients, meals } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
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

  const [existingMeal] = await db.select().from(meals).where(eq(meals.id, mealId));

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

  const ingredients = await db
    .select()
    .from(mealIngredients)
    .where(eq(mealIngredients.mealId, mealId));

  const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  return NextResponse.json({ ...meal, ingredients });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const mealId = Number.parseInt(id, 10);

  if (Number.isNaN(mealId)) {
    return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
  }

  const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));

  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }

  await db.delete(meals).where(eq(meals.id, mealId));

  return NextResponse.json({ ok: true });
}
