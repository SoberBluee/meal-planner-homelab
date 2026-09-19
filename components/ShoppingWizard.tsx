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
  Weekday,
  WeekPlanDay,
} from "@/lib/types";
import { SHOPPING_DRAFT_KEY, WEEKDAYS } from "@/lib/types";
import { Button, EmptyState, FieldLabel, ListShell, Select, TextInput } from "./ui";

type WizardStep = "meals" | "essentials" | "review";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "meals", label: "Meals" },
  { id: "essentials", label: "Essentials" },
  { id: "review", label: "Review" },
];

function emptyWeekPlan(): WeekPlanDay[] {
  return WEEKDAYS.map((day) => ({
    day,
    mealId: null,
    mealTitle: null,
  }));
}

export default function ShoppingWizard({
  meals,
  essentials,
}: {
  meals: MealWithIngredients[];
  essentials: EssentialItemRecord[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("meals");
  const [weekPlan, setWeekPlan] = useState<WeekPlanDay[]>(emptyWeekPlan);
  const [checkedEssentials, setCheckedEssentials] = useState<string[]>(
    essentials.map((item) => item.name),
  );
  const [extraEssentials, setExtraEssentials] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState("");

  const assignedDays = weekPlan.filter((entry) => entry.mealId != null);

  const selectedMealIds = useMemo(
    () => [...new Set(assignedDays.map((entry) => entry.mealId!))],
    [assignedDays],
  );

  const mealCost = useMemo(() => {
    let total = 0;
    let hasPrice = false;

    for (const entry of assignedDays) {
      const meal = meals.find((item) => item.id === entry.mealId);
      if (meal?.price != null) {
        total += meal.price;
        hasPrice = true;
      }
    }

    return hasPrice ? total : null;
  }, [assignedDays, meals]);

  const mergedList = useMemo(() => {
    const mealIngredients = assignedDays.flatMap((entry) => {
      const meal = meals.find((item) => item.id === entry.mealId);
      if (!meal) return [];
      return meal.ingredients.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));
    });

    const essentialIngredients = [
      ...checkedEssentials.map((name) => ({ name })),
      ...extraEssentials.map((name) => ({ name })),
    ];

    return mergeIngredients([...mealIngredients, ...essentialIngredients]);
  }, [assignedDays, meals, checkedEssentials, extraEssentials]);

  function setDayMeal(day: Weekday, mealIdValue: string) {
    const mealId = mealIdValue ? Number.parseInt(mealIdValue, 10) : null;
    const meal =
      mealId != null && !Number.isNaN(mealId)
        ? meals.find((item) => item.id === mealId)
        : null;

    setWeekPlan((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              day,
              mealId: meal?.id ?? null,
              mealTitle: meal?.title ?? null,
            }
          : entry,
      ),
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
      weekPlan,
      checkedEssentials,
      extraEssentials,
      mealCost,
      mergedList,
      listText: formatShoppingListText(mergedList, {
        mealCost,
        weekPlan,
      }),
    };
    sessionStorage.setItem(SHOPPING_DRAFT_KEY, JSON.stringify(draft));
    router.push("/shop/complete");
  }

  const stepIndex = steps.findIndex((item) => item.id === step);
  const canContinueMeals =
    assignedDays.length > 0 || essentials.length > 0;

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
          <p className="text-sm text-muted">
            Assign a meal to each day you want to cook. The same meal can be used
            more than once.
          </p>

          {meals.length === 0 ? (
            <EmptyState>
              No meals saved yet. Add some on the Meals page first.
            </EmptyState>
          ) : (
            <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
              {weekPlan.map((entry) => (
                <div
                  key={entry.day}
                  className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center"
                >
                  <FieldLabel>{entry.day}</FieldLabel>
                  <Select
                    value={entry.mealId != null ? String(entry.mealId) : ""}
                    onChange={(event) =>
                      setDayMeal(entry.day, event.target.value)
                    }
                  >
                    <option value="">None</option>
                    {meals.map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.title}
                        {meal.price != null
                          ? ` · £${meal.price.toFixed(2)}`
                          : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          )}

          {mealCost != null ? (
            <p className="text-sm text-muted">
              Subtotal:{" "}
              <span className="font-medium text-foreground">
                £{mealCost.toFixed(2)}
              </span>
            </p>
          ) : null}

          <Button
            type="button"
            onClick={() => setStep("essentials")}
            disabled={!canContinueMeals}
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
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted">This week</h2>
            <ListShell>
              {weekPlan.map((entry) => (
                <li key={entry.day} className="px-4 py-3 text-sm">
                  <span className="font-medium">{entry.day}</span>
                  {" — "}
                  {entry.mealTitle ?? (
                    <span className="text-muted">No meal</span>
                  )}
                </li>
              ))}
            </ListShell>
          </div>

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
              <span className="font-medium text-foreground">
                £{mealCost.toFixed(2)}
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("essentials")}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={finishTrip}
              disabled={mergedList.length === 0}
            >
              Finish & export
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
