import HistoryView from "@/components/HistoryView";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getDeletedMeals, getTrips } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let trips;
  let deletedMeals;
  try {
    [trips, deletedMeals] = await Promise.all([getTrips(), getDeletedMeals()]);
    logPageView("/history", {
      action: "page.history.view",
      extra: { tripCount: trips.length, deletedMealCount: deletedMeals.length },
    });
  } catch (error) {
    return renderPageError(error, "/history");
  }

  return (
    <PageShell
      title="History"
      subtitle="Every list you've finished, plus meals you've deleted."
    >
      <HistoryView trips={trips} deletedMeals={deletedMeals} />
    </PageShell>
  );
}
