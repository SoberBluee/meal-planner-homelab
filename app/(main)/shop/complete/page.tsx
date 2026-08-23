import ExportPanel from "@/components/ExportPanel";
import { PageShell } from "@/components/ui";

export default function ShopCompletePage() {
  return (
    <PageShell
      title="Your list"
      subtitle="Copy or share to Apple Notes."
    >
      <ExportPanel />
    </PageShell>
  );
}
