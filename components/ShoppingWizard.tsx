"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatShoppingListText,
  mergeIngredients,
} from "@/lib/merge-ingredients";
import type {
  EssentialItemRecord,
  MealWithIngredients,
  ShoppingDraft,
} from "@/lib/types";
import { SHOPPING_DRAFT_KEY } from "@/lib/types";
import { Button, EmptyState, FieldLabel, ListShell, TextInput } from "./ui";

type WizardStep = "meals" | "essentials" | "review";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "meals", label: "Meals" },
  { id: "essentials", label: "Essentials" },
  { id: "review", label: "Review" },
];

export default function ShoppingWizard({
  meals,
  essentials,
}: {
  meals: MealWithIngredients[];
  essentials: EssentialItemRecord[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("meals");
  const [selectedMealIds, setSelectedMealIds] = useState<number[]>([]);
  const [checkedEssentials, setCheckedEssentials] = useState<string[]>(
    essentials.map((item) => item.name),
  );
  const [extraEssentials, setExtraEssentials] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState("");

  const selectedMeals = meals.filter((meal) => selectedMealIds.includes(meal.id));

  const mealCost = useMemo(() => {
    const prices = selectedMeals
      .map((meal) => meal.price)
      .filter((price): price is number => price != null);
    if (prices.length === 0) return null;
    return prices.reduce((sum, price) => sum + price, 0);
  }, [selectedMeals]);

  const mergedList = useMemo(() => {
    const mealIngredients = selectedMeals.flatMap((meal) =>
      meal.ingredients.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      })),
    );

    const essentialIngredients = [
      ...checkedEssentials.map((name) => ({ name })),
      ...extraEssentials.map((name) => ({ name })),
    ];

    return mergeIngredients([...mealIngredients, ...essentialIngredients]);
  }, [selectedMeals, checkedEssentials, extraEssentials]);

  function toggleMeal(id: number) {
    setSelectedMealIds((current) =>
      current.includes(id)
        ? current.filter((mealId) => mealId !== id)
        : [...current, id],
    );
  }

  function toggleEssential(name: string) {
    setCheckedEssentials((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }

  function addExtraEssential() {
    const name = extraInput.trim();
    if (!name) return;
    if (!extraEssentials.includes(name) && !checkedEssentials.includes(name)) {
      setExtraEssentials((current) => [...current, name]);
    }
    setExtraInput("");
  }

  function finishTrip() {
    const draft: ShoppingDraft = {
      selectedMealIds,
      checkedEssentials,
      extraEssentials,
      mealCost,
      mergedList,
      listText: formatShoppingListText(mergedList, { mealCost }),
    };
    sessionStorage.setItem(SHOPPING_DRAFT_KEY, JSON.stringify(draft));
    router.push("/shop/complete");
  }

  const stepIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        {steps.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStep(item.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                step === item.id
                  ? "bg-accent text-white"
                  : index < stepIndex
                    ? "bg-accent/10 text-accent"
                    : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
            {index < steps.length - 1 ? (
              <span className="text-border">/</span>
            ) : null}
          </div>
        ))}
      </div>

      {step === "meals" ? (
        <section className="space-y-6">
          {meals.length === 0 ? (
            <EmptyState>
              No meals saved yet. Add some on the Meals page first.
            </EmptyState>
          ) : (
            <ListShell>
              {meals.map((meal) => {
                const checked = selectedMealIds.includes(meal.id);
                return (
                  <li key={meal.id}>
                    <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-background">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMeal(meal.id)}
                        className="mt-0.5"
                      />
                      <span className="flex-1">
                        <span className="font-medium">{meal.title}</span>
                        <span className="mt-0.5 block text-sm text-muted">
                          {meal.ingredients.length} ingredients
                          {meal.price != null
                            ? ` · £${meal.price.toFixed(2)}`
                            : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ListShell>
          )}

          {mealCost != null ? (
            <p className="text-sm text-muted">
              Subtotal: <span className="font-medium text-foreground">£{mealCost.toFixed(2)}</span>
            </p>
          ) : null}

          <Button
            type="button"
            onClick={() => setStep("essentials")}
            disabled={selectedMealIds.length === 0 && essentials.length === 0}
          >
            Continue
          </Button>
        </section>
      ) : null}

      {step === "essentials" ? (
        <section className="space-y-6">
          <p className="text-sm text-muted">
            Your usual staples are pre-selected. Uncheck or add extras for this week.
          </p>

          {essentials.length === 0 && extraEssentials.length === 0 ? (
            <EmptyState>
              No essentials template yet. Add items below or set them up on the Essentials page.
            </EmptyState>
          ) : (
            <ListShell>
              {essentials.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-background">
                    <input
                      type="checkbox"
                      checked={checkedEssentials.includes(item.name)}
                      onChange={() => toggleEssential(item.name)}
                    />
                    <span className="font-medium">{item.name}</span>
                  </label>
                </li>
              ))}
              {extraEssentials.map((name) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <span className="font-medium">{name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setExtraEssentials((current) =>
                        current.filter((item) => item !== name),
                      )
                    }
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ListShell>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FieldLabel>One-off item</FieldLabel>
              <TextInput
                value={extraInput}
                onChange={(event) => setExtraInput(event.target.value)}
                placeholder="Butter"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addExtraEssential();
                  }
                }}
              />
            </div>
            <Button type="button" variant="secondary" onClick={addExtraEssential}>
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("meals")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("review")}>
              Review list
            </Button>
          </div>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="space-y-6">
          <p className="text-sm text-muted">
            {mergedList.length} items · duplicates merged
          </p>

          <ListShell>
            {mergedList.map((item) => (
              <li
                key={`${item.name}-${item.unit ?? "none"}-${item.quantity ?? "none"}`}
                className="px-4 py-3 text-sm"
              >
                {item.display}
              </li>
            ))}
          </ListShell>

          {mealCost != null ? (
            <p className="text-sm text-muted">
              Estimated cost:{" "}
              <span className="font-medium text-foreground">£{mealCost.toFixed(2)}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("essentials")}>
              Back
            </Button>
            <Button type="button" onClick={finishTrip} disabled={mergedList.length === 0}>
              Finish & export
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
