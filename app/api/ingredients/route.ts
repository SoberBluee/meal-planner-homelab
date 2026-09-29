import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIngredients } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients } from "@/lib/schema";
import { INGREDIENT_CATEGORIES } from "@/lib/types";

export async function GET() {
  return NextResponse.json(await getIngredients());
}

export async function POST(request: Request) {
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
  if (
    !category ||
    !INGREDIENT_CATEGORIES.includes(
      category as (typeof INGREDIENT_CATEGORIES)[number],
    )
  ) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const existing = await db.select().from(ingredients);
  const maxOrder = existing.reduce(
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

  await invalidate(CACHE_KEYS.ingredients);

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

  return NextResponse.json(item, { status: 201 });
}
