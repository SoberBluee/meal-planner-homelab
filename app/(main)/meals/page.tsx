import { asc, eq } from "drizzle-orm";
import MealList from "@/components/MealList";
import { PageShell } from "@/components/ui";
import { db } from "@/lib/db";
import { mealIngredients, meals } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  const allMeals = await db.select().from(meals).orderBy(asc(meals.title));

  const initialMeals = await Promise.all(
    allMeals.map(async (meal) => {
      const ingredients = await db
        .select()
        .from(mealIngredients)
        .where(eq(mealIngredients.mealId, meal.id));
      return { ...meal, ingredients };
    }),
  );

  return (
    <PageShell
      title="Meals"
      subtitle="Save recipes with ingredients and optional prices."
    >
      <MealList initialMeals={initialMeals} />
    </PageShell>
  );
}
