import MealList from "@/components/MealList";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getMealsWithIngredients } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  let initialMeals;
  try {
    initialMeals = await getMealsWithIngredients();
    logPageView("/meals", {
      action: "page.meals.view",
      extra: { mealCount: initialMeals.length },
    });
  } catch (error) {
    return renderPageError(error, "/meals");
  }

  return (
    <PageShell
      title="Meals"
      subtitle="Save recipes with ingredients and optional prices."
    >
      <MealList initialMeals={initialMeals} />
    </PageShell>
  );
}
