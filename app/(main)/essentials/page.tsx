import { asc } from "drizzle-orm";
import EssentialsList from "@/components/EssentialsList";
import { PageShell } from "@/components/ui";
import { db } from "@/lib/db";
import { essentialItems } from "@/lib/schema";

export const dynamic = "force-dynamic";

export default async function EssentialsPage() {
  const initialItems = await db
    .select()
    .from(essentialItems)
    .orderBy(asc(essentialItems.sortOrder), asc(essentialItems.name));

  return (
    <PageShell
      title="Essentials"
      subtitle="Staples that pre-fill every shopping trip."
    >
      <EssentialsList initialItems={initialItems} />
    </PageShell>
  );
}
