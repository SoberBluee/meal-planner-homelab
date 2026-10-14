"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DeletedMealRecord, TripRecord } from "@/lib/types";
import { Button, EmptyState, ListShell, SectionTitle } from "./ui";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/London",
});

function formatDate(value: string | Date) {
  return dateFormat.format(new Date(value));
}

export default function HistoryView({
  trips,
  deletedMeals,
}: {
  trips: TripRecord[];
  deletedMeals: DeletedMealRecord[];
}) {
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function restoreMeal(id: number) {
    setError("");
    setRestoringId(id);
    const response = await fetch(`/api/meals/${id}/restore`, { method: "POST" });
    setRestoringId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not restore meal");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <SectionTitle>Past lists</SectionTitle>
        {trips.length === 0 ? (
          <EmptyState>
            No saved lists yet. Finish a shopping trip and it will appear here.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <article
                key={trip.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg font-medium">
                    {formatDate(trip.createdAt)}
                  </h3>
                  <p className="text-sm text-muted">
                    {trip.itemCount} items
                    {trip.mealCost != null
                      ? ` · £${trip.mealCost.toFixed(2)}`
                      : ""}
                  </p>
                </header>
                {trip.days.length === 0 ? (
                  <p className="text-sm text-muted">No meals planned.</p>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {trip.days.map((day) => (
                      <li key={day.id}>
                        <span className="font-medium">{day.day}</span>
                        {" — "}
                        {day.mealTitle}
                        {day.cookerName ? (
                          <span className="text-muted">
                            {" "}
                            · {day.cookerName} cooking
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Deleted meals</SectionTitle>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {deletedMeals.length === 0 ? (
          <EmptyState>Meals you delete will be kept here.</EmptyState>
        ) : (
          <ListShell>
            {deletedMeals.map((meal) => (
              <li
                key={meal.id}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <div>
                  <span className="font-medium">{meal.title}</span>
                  <p className="mt-0.5 text-sm text-muted">
                    {meal.ingredientCount} ingredients · deleted{" "}
                    {formatDate(meal.deletedAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => restoreMeal(meal.id)}
                  disabled={restoringId === meal.id}
                >
                  {restoringId === meal.id ? "Restoring…" : "Restore"}
                </Button>
              </li>
            ))}
          </ListShell>
        )}
      </section>
    </div>
  );
}
