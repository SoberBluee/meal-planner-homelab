import IngredientsList from "@/components/IngredientsList";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getIngredients, getShopLayout } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  let initialItems;
  let layout;
  try {
    [initialItems, layout] = await Promise.all([
      getIngredients(),
      getShopLayout(),
    ]);
    logPageView("/ingredients", {
      action: "page.ingredients.view",
      extra: { ingredientCount: initialItems.length },
    });

  } catch (error) {
    return renderPageError(error, "/ingredients");
  }

  return (
    <PageShell
      title="Ingredients"
      subtitle="The ingredients you use to make meals."
    >
      <IngredientsList
        initialItems={initialItems}
        sections={layout.sections}
      />
    </PageShell>
  );
}
