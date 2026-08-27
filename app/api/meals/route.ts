import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { mealIngredients, meals } from "@/lib/schema";

export async function GET() {
  return handleRoute("GET /api/meals", async () => {
    const allMeals = await db.select().from(meals).orderBy(asc(meals.title));

    const result = await Promise.all(
      allMeals.map(async (meal) => {
        const ingredients = await db
          .select()
          .from(mealIngredients)
          .where(eq(mealIngredients.mealId, meal.id));

        return { ...meal, ingredients };
      }),
    );

    return NextResponse.json(result);
  });
}

export async function POST(request: Request) {
  return handleRoute("POST /api/meals", async () => {
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

    const inserted = await db
      .insert(meals)
      .values({
        title,
        price: body.price ?? null,
      })
      .$returningId();

    const mealId = inserted[0]?.id;
    if (!mealId) {
      return NextResponse.json(
        { error: "Could not create meal" },
        { status: 500 },
      );
    }

    const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
    if (!meal) {
      return NextResponse.json(
        { error: "Could not load created meal" },
        { status: 500 },
      );
    }

    const ingredientRows = (body.ingredients ?? [])
      .map((item) => ({
        mealId: meal.id,
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
      .where(eq(mealIngredients.mealId, meal.id));

    return NextResponse.json({ ...meal, ingredients }, { status: 201 });
  });
}

// export async function GET() {
//   const allMeals = await db.select().from(meals).orderBy(asc(meals.title));

//   const result = await Promise.all(
//     allMeals.map(async (meal) => {
//       const ingredients = await db
//         .select()
//         .from(mealIngredients)
//         .where(eq(mealIngredients.mealId, meal.id));

//       return { ...meal, ingredients };
//     }),
//   );

//   return NextResponse.json(result);
// }

// export async function POST(request: Request) {
//   const body = (await request.json()) as {
//     title?: string;
//     price?: number | null;
//     ingredients?: Array<{
//       name: string;
//       quantity?: number | null;
//       unit?: string | null;
//     }>;
//   };

//   const title = body.title?.trim();
//   if (!title) {
//     return NextResponse.json({ error: "Title is required" }, { status: 400 });
//   }

//   const inserted = await db
//     .insert(meals)
//     .values({
//       title,
//       price: body.price ?? null,
//     })
//     .$returningId();

//   const mealId = inserted[0]?.id;
//   if (!mealId) {
//     return NextResponse.json(
//       { error: "Could not create meal" },
//       { status: 500 },
//     );
//   }

//   const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));
//   if (!meal) {
//     return NextResponse.json(
//       { error: "Could not load created meal" },
//       { status: 500 },
//     );
//   }

//   const ingredientRows = (body.ingredients ?? [])
//     .map((item) => ({
//       mealId: meal.id,
//       name: item.name.trim(),
//       quantity: item.quantity ?? null,
//       unit: item.unit?.trim() || null,
//     }))
//     .filter((item) => item.name);

//   if (ingredientRows.length > 0) {
//     await db.insert(mealIngredients).values(ingredientRows);
//   }

//   const ingredients = await db
//     .select()
//     .from(mealIngredients)
//     .where(eq(mealIngredients.mealId, meal.id));

//   return NextResponse.json({ ...meal, ingredients }, { status: 201 });
// }
