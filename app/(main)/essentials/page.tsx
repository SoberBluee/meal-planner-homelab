import EssentialsList from "@/components/EssentialsList";
import { PageShell } from "@/components/ui";
import { renderPageError } from "@/lib/page-error";
import { getEssentials } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EssentialsPage() {
  try {
    const initialItems = await getEssentials();

    return (
      <PageShell
        title="Essentials"
        subtitle="Staples that pre-fill every shopping trip."
      >
        <EssentialsList initialItems={initialItems} />
      </PageShell>
    );
  } catch (error) {
    return renderPageError(error, "/essentials");
  }
}
