"use client";

import { useMemo, useState } from "react";
import type { MealWithIngredients } from "@/lib/types";
import MealForm from "./MealForm";
import { Button, EmptyState, FieldLabel, ListShell, SectionTitle, TextInput } from "./ui";

export default function MealList({
  initialMeals,
}: {
  initialMeals: MealWithIngredients[];
}) {
  const [meals, setMeals] = useState(initialMeals);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(initialMeals.length === 0);

  const filteredMeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return meals;

    return meals.filter((meal) => {
      if (meal.title.toLowerCase().includes(query)) return true;
      return meal.ingredients.some((ingredient) =>
        ingredient.name.toLowerCase().includes(query),
      );
    });
  }, [meals, search]);

  async function refreshMeals() {
    const response = await fetch("/api/meals");
    const data = (await response.json()) as MealWithIngredients[];
    setMeals(data);
    setEditingId(null);
    setShowForm(false);
  }

  async function deleteMeal(id: number) {
    if (!window.confirm("Delete this meal?")) return;
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    await refreshMeals();
  }

  const editingMeal = meals.find((meal) => meal.id === editingId);

  return (
    <div className="space-y-8">
      {meals.length > 0 ? (
        <div>
          <FieldLabel>Search meals</FieldLabel>
          <TextInput
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or ingredient..."
          />
        </div>
      ) : null}

      {showForm ? (
        <section className="space-y-4">
          <SectionTitle>{editingMeal ? "Edit meal" : "New meal"}</SectionTitle>
          <MealForm
            meal={editingMeal}
            onSaved={refreshMeals}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </section>
      ) : (
        <Button type="button" onClick={() => setShowForm(true)}>
          Add meal
        </Button>
      )}

      <section className="space-y-4">
        <SectionTitle>
          Saved meals · {filteredMeals.length}
          {search.trim() && filteredMeals.length !== meals.length
            ? ` of ${meals.length}`
            : ""}
        </SectionTitle>
        {meals.length === 0 ? (
          <EmptyState>No meals yet. Add your first one above.</EmptyState>
        ) : filteredMeals.length === 0 ? (
          <EmptyState>No meals match &ldquo;{search.trim()}&rdquo;.</EmptyState>
        ) : (
          <ListShell>
            {filteredMeals.map((meal) => (
              <li
                key={meal.id}
                className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <div>
                  <h3 className="font-serif text-lg font-medium">{meal.title}</h3>
                  {meal.price != null ? (
                    <p className="mt-0.5 text-sm text-muted">
                      £{meal.price.toFixed(2)}
                    </p>
                  ) : null}
                  <ul className="mt-3 space-y-0.5 text-sm text-muted">
                    {meal.ingredients.map((ingredient) => (
                      <li key={ingredient.id}>
                        {ingredient.quantity != null ? `${ingredient.quantity}` : ""}
                        {ingredient.unit
                          ? `${ingredient.unit} `
                          : ingredient.quantity != null
                            ? " "
                            : ""}
                        {ingredient.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex gap-2 sm:flex-col sm:items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingId(meal.id);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => deleteMeal(meal.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ListShell>
        )}
      </section>
    </div>
  );
}
