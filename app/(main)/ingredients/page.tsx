import IngredientsList from "@/components/IngredientsList";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getIngredients } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  try {
    const initialItems = await getIngredients();
    logPageView("/ingredients", {
      action: "page.ingredients.view",
      extra: { ingredientCount: initialItems.length },
    });

    return (
      <PageShell
        title="Ingredients"
        subtitle="The ingredients you use to make meals."
      >
        <IngredientsList initialItems={initialItems} />
      </PageShell>
    );
  } catch (error) {
    return renderPageError(error, "/ingredients");
  }
}
