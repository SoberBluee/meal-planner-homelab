"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button, EmptyState, FieldLabel, ListShell, TextInput } from "./ui";

type WizardStep = "meals" | "schedule" | "essentials" | "review";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "meals", label: "Meals" },
  { id: "schedule", label: "Schedule" },
  { id: "essentials", label: "Essentials" },
  { id: "review", label: "Review" },
];

const MEAL_DRAG_TYPE = "application/x-meal-id";

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
  const [selectedMealIds, setSelectedMealIds] = useState<number[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlanDay[]>(emptyWeekPlan);
  const [dragOverDay, setDragOverDay] = useState<Weekday | null>(null);
  const [checkedEssentials, setCheckedEssentials] = useState<string[]>(
    essentials.map((item) => item.name),
  );
  const [extraEssentials, setExtraEssentials] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState("");

  const selectedMeals = meals.filter((meal) =>
    selectedMealIds.includes(meal.id),
  );

  const assignedDays = weekPlan.filter((entry) => entry.mealId != null);

  useEffect(() => {
    setWeekPlan((current) =>
      current.map((entry) => {
        if (entry.mealId == null || selectedMealIds.includes(entry.mealId)) {
          return entry;
        }
        return { day: entry.day, mealId: null, mealTitle: null };
      }),
    );
  }, [selectedMealIds]);

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

  function toggleMeal(id: number) {
    setSelectedMealIds((current) =>
      current.includes(id)
        ? current.filter((mealId) => mealId !== id)
        : [...current, id],
    );
  }

  function assignMealToDay(day: Weekday, mealId: number) {
    const meal = meals.find((item) => item.id === mealId);
    if (!meal || !selectedMealIds.includes(mealId)) return;

    setWeekPlan((current) =>
      current.map((entry) =>
        entry.day === day
          ? { day, mealId: meal.id, mealTitle: meal.title }
          : entry,
      ),
    );
  }

  function clearDay(day: Weekday) {
    setWeekPlan((current) =>
      current.map((entry) =>
        entry.day === day
          ? { day, mealId: null, mealTitle: null }
          : entry,
      ),
    );
  }

  function onMealDragStart(
    event: React.DragEvent<HTMLDivElement>,
    mealId: number,
  ) {
    event.dataTransfer.setData(MEAL_DRAG_TYPE, String(mealId));
    event.dataTransfer.effectAllowed = "copy";
  }

  function onDayDragOver(
    event: React.DragEvent<HTMLDivElement>,
    day: Weekday,
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setDragOverDay(day);
  }

  function onDayDrop(event: React.DragEvent<HTMLDivElement>, day: Weekday) {
    event.preventDefault();
    setDragOverDay(null);
    const raw = event.dataTransfer.getData(MEAL_DRAG_TYPE);
    const mealId = Number.parseInt(raw, 10);
    if (!Number.isNaN(mealId)) {
      assignMealToDay(day, mealId);
    }
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

    const weekDaysWithMeals = weekPlan.filter((day) => day.mealId !== null).length;
    void fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "shop.trip.complete",
        selectedMealCount: selectedMealIds.length,
        checkedEssentialsCount: checkedEssentials.length,
        extraEssentialsCount: extraEssentials.length,
        weekDaysWithMeals,
        mergedLineCount: mergedList.length,
        mealCost,
      }),
    });

    router.push("/shop/complete");
  }

  const stepIndex = steps.findIndex((item) => item.id === step);
  const canContinueMeals =
    selectedMealIds.length > 0 || essentials.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
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

          <Button
            type="button"
            onClick={() => setStep("schedule")}
            disabled={!canContinueMeals}
          >
            Continue
          </Button>
        </section>
      ) : null}

      {step === "schedule" ? (
        <section className="space-y-6">
          <p className="text-sm text-muted">
            Drag meals from the left into each day. The same meal can go on more
            than one day.
          </p>

          {selectedMeals.length === 0 ? (
            <EmptyState>
              No meals selected. Go back and choose meals for this trip.
            </EmptyState>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,14rem)_1fr]">
              <div>
                <h2 className="mb-3 text-sm font-medium text-muted">Meals</h2>
                <div className="space-y-2">
                  {selectedMeals.map((meal) => (
                    <div
                      key={meal.id}
                      draggable
                      onDragStart={(event) => onMealDragStart(event, meal.id)}
                      className="cursor-grab rounded-xl border border-border bg-surface px-3 py-3 active:cursor-grabbing"
                    >
                      <p className="font-medium">{meal.title}</p>
                      <p className="mt-0.5 text-sm text-muted">
                        {meal.ingredients.length} ingredients
                        {meal.price != null
                          ? ` · £${meal.price.toFixed(2)}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-sm font-medium text-muted">This week</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {weekPlan.map((entry) => {
                    const active = dragOverDay === entry.day;
                    return (
                      <div
                        key={entry.day}
                        onDragOver={(event) => onDayDragOver(event, entry.day)}
                        onDragLeave={() =>
                          setDragOverDay((current) =>
                            current === entry.day ? null : current,
                          )
                        }
                        onDrop={(event) => onDayDrop(event, entry.day)}
                        className={`min-h-[5.5rem] rounded-xl border border-dashed p-3 transition-colors ${
                          active
                            ? "border-accent bg-accent/10"
                            : "border-border bg-surface"
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{entry.day}</span>
                          {entry.mealId != null ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => clearDay(entry.day)}
                            >
                              Clear
                            </Button>
                          ) : null}
                        </div>
                        {entry.mealTitle ? (
                          <p className="text-sm font-medium">{entry.mealTitle}</p>
                        ) : (
                          <p className="text-sm text-muted">Drop a meal here</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
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

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("meals")}
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep("essentials")}
              disabled={assignedDays.length === 0}
            >
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === "essentials" ? (
        <section className="space-y-6">
          <p className="text-sm text-muted">
            Your usual staples are pre-selected. Uncheck or add extras for this
            week.
          </p>

          {essentials.length === 0 && extraEssentials.length === 0 ? (
            <EmptyState>
              No essentials template yet. Add items below or set them up on the
              Essentials page.
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
            <Button
              type="button"
              variant="secondary"
              onClick={addExtraEssential}
            >
              Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep("schedule")}
            >
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
