import { asc } from "drizzle-orm";
import IngredientsList from "@/components/IngredientsList";
import { PageShell } from "@/components/ui";
import { db } from "@/lib/db";
import { renderPageError } from "@/lib/page-error";
import { ingredients } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function IngredientsPage() {
  try {
    const initialItems = await db
      .select()
      .from(ingredients)
      .orderBy(asc(ingredients.sortOrder), asc(ingredients.name));

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
