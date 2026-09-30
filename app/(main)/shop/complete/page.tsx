import ExportPanel from "@/components/ExportPanel";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";

export default function ShopCompletePage() {
  logPageView("/shop/complete", { action: "page.shop.complete" });

  return (
    <PageShell
      title="Your list"
      subtitle="Copy or share to Apple Notes."
    >
      <ExportPanel />
    </PageShell>
  );
}
