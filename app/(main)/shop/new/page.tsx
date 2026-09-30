import ShoppingWizard from "@/components/ShoppingWizard";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getEssentials, getMealsWithIngredients } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopNewPage() {
  try {
    const [mealsWithIngredients, essentials] = await Promise.all([
      getMealsWithIngredients(),
      getEssentials(),
    ]);

    logPageView("/shop/new", {
      action: "page.shop.new",
      extra: {
        mealCount: mealsWithIngredients.length,
        essentialCount: essentials.length,
      },
    });

    return (
      <PageShell
        title="New trip"
        subtitle="Pick meals, schedule the week, confirm essentials, export your list."
      >
        <ShoppingWizard meals={mealsWithIngredients} essentials={essentials} />
      </PageShell>
    );
  } catch (error) {
    return renderPageError(error, "/shop/new");
  }
}
