import ShopLayoutEditor from "@/components/ShopLayoutEditor";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getShopLayout } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ShopLayoutPage() {
  let layout;
  try {
    layout = await getShopLayout();
    logPageView("/shop-layout", {
      action: "page.shop_layout.view",
      extra: {
        sectionCount: layout.sections.length,
        ingredientCount: layout.ingredients.length,
      },
    });

  } catch (error) {
    return renderPageError(error, "/shop-layout");
  }

  return (
    <PageShell
      title="Shop layout"
      subtitle="Arrange sections and ingredients in the order you walk around the shop."
    >
      <ShopLayoutEditor initialLayout={layout} />
    </PageShell>
  );
}
