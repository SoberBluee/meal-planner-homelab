import MealList from "@/components/MealList";
import { PageShell } from "@/components/ui";
import { renderPageError } from "@/lib/page-error";
import { getMealsWithIngredients } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  try {
    const initialMeals = await getMealsWithIngredients();

    return (
      <PageShell
        title="Meals"
        subtitle="Save recipes with ingredients and optional prices."
      >
        <MealList initialMeals={initialMeals} />
      </PageShell>
    );
  } catch (error) {
    return renderPageError(error, "/meals");
  }
}
