import PeopleList from "@/components/PeopleList";
import { PageShell } from "@/components/ui";
import { logPageView } from "@/lib/log-page-view";
import { renderPageError } from "@/lib/page-error";
import { getPeople } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  let people;
  try {
    people = await getPeople();
    logPageView("/people", {
      action: "page.people.view",
      extra: { peopleCount: people.length },
    });
  } catch (error) {
    return renderPageError(error, "/people");
  }

  return (
    <PageShell
      title="People"
      subtitle="Manage the people who can cook meals."
    >
      <PeopleList initialPeople={people} />
    </PageShell>
  );
}
