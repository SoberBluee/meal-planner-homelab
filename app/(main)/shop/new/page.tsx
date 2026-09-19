import { asc, eq } from "drizzle-orm";
import ShoppingWizard from "@/components/ShoppingWizard";
import { PageShell } from "@/components/ui";
import { db } from "@/lib/db";
import { renderPageError } from "@/lib/page-error";
import { essentialItems, mealIngredients, meals } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function ShopNewPage() {
  try {
    const allMeals = await db.select().from(meals).orderBy(asc(meals.title));
    const mealsWithIngredients = await Promise.all(
      allMeals.map(async (meal) => {
        const ingredients = await db
          .select()
          .from(mealIngredients)
          .where(eq(mealIngredients.mealId, meal.id));
        return { ...meal, ingredients };
      }),
    );

    const essentials = await db
      .select()
      .from(essentialItems)
      .orderBy(asc(essentialItems.sortOrder), asc(essentialItems.name));

    return (
      <PageShell
        title="New trip"
        subtitle="Assign meals to days, confirm essentials, export your list."
      >
        <ShoppingWizard meals={mealsWithIngredients} essentials={essentials} />
      </PageShell>
    );
  } catch (error) {
    return renderPageError(error, "/shop/new");
  }
}
