import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { meals } from "@/lib/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;

  return handleRoute(
    `POST /api/meals/${id}/restore`,
    "meal.restore",
    async () => {
      const mealId = Number.parseInt(id, 10);

      if (Number.isNaN(mealId)) {
        return NextResponse.json({ error: "Invalid meal id" }, { status: 400 });
      }

      const [meal] = await db.select().from(meals).where(eq(meals.id, mealId));

      if (!meal || !meal.deletedAt) {
        return NextResponse.json(
          { error: "Archived meal not found" },
          { status: 404 },
        );
      }

      await db
        .update(meals)
        .set({ deletedAt: null })
        .where(eq(meals.id, mealId));
      await invalidate(CACHE_KEYS.meals, CACHE_KEYS.deletedMeals);

      logAction({
        action: "meal.restore",
        outcome: "success",
        resource: "meal",
        resourceId: mealId,
        summary: `Restored meal "${meal.title}"`,
        title: meal.title,
      });

      return NextResponse.json({ ok: true });
    },
    request,
  );
}
