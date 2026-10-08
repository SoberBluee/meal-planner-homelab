import ShoppingWizard from "@/components/ShoppingWizard";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import {
  getEssentials,
  getMealsWithIngredients,
  getPeople,
  getShopLayout,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopNewPage() {
  let mealsWithIngredients;
  let essentials;
  let shopLayout;
  let people;
  try {
    [mealsWithIngredients, essentials, shopLayout, people] = await Promise.all([
      getMealsWithIngredients(),
      getEssentials(),
      getShopLayout(),
      getPeople(),
    ]);

    logPageView("/shop/new", {
      action: "page.shop.new",
      extra: {
        mealCount: mealsWithIngredients.length,
        essentialCount: essentials.length,
      },
    });

  } catch (error) {
    return renderPageError(error, "/shop/new");
  }

  return (
    <PageShell
      title="New trip"
      subtitle="Pick meals, schedule the week, confirm essentials, export your list."
    >
      <ShoppingWizard
        meals={mealsWithIngredients}
        essentials={essentials}
        shopLayout={shopLayout}
        people={people}
      />
    </PageShell>
  );
}
