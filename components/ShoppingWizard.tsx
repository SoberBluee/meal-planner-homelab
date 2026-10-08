"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes reactive drag state through refs */

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import {
  formatShoppingListText,
  mergeIngredients,
} from "@/lib/merge-ingredients";
import type {
  EssentialItemRecord,
  MealWithIngredients,
  PersonRecord,
  ShopLayout,
  ShoppingDraft,
  Weekday,
  WeekPlanDay,
} from "@/lib/types";
import { SHOPPING_DRAFT_KEY, WEEKDAYS } from "@/lib/types";
import SearchableSelect from "./SearchableSelect";
import { Button, EmptyState, FieldLabel, ListShell, TextInput } from "./ui";

type WizardStep = "meals" | "schedule" | "essentials" | "review";

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: "meals", label: "Meals" },
  { id: "schedule", label: "Schedule" },
  { id: "essentials", label: "Essentials" },
  { id: "review", label: "Review" },
];

function emptyWeekPlan(): WeekPlanDay[] {
  return WEEKDAYS.map((day) => ({
    day,
    mealId: null,
    mealTitle: null,
    cookerId: null,
    cookerName: null,
  }));
}

function DraggableMeal({ meal }: { meal: MealWithIngredients }) {
  const drag = useDraggable({ id: `meal-${meal.id}` });
  return (
    <button
      ref={drag.setNodeRef}
      type="button"
      style={{
        transform: drag.transform
          ? `translate3d(${drag.transform.x}px, ${drag.transform.y}px, 0)`
          : undefined,
      }}
      className={`w-full touch-none rounded-xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md ${
        drag.isDragging ? "z-30 opacity-60 shadow-xl" : ""
      }`}
      {...drag.attributes}
      {...drag.listeners}
    >
      <p className="font-medium">{meal.title}</p>
      <p className="mt-1 text-xs text-muted">
        {meal.ingredients.length} ingredients
        {meal.price != null ? ` · £${meal.price.toFixed(2)}` : ""}
      </p>
    </button>
  );
}

function DayDropZone({
  entry,
  people,
  availableMeals,
  onAssign,
  onClear,
  onCooker,
}: {
  entry: WeekPlanDay;
  people: PersonRecord[];
  availableMeals: MealWithIngredients[];
  onAssign: (mealId: number) => void;
  onClear: () => void;
  onCooker: (personId: number | null) => void;
}) {
  const drop = useDroppable({ id: `day-${entry.day}` });
  return (
    <article
      ref={drop.setNodeRef}
      className={`relative min-h-44 overflow-visible rounded-2xl border p-4 transition ${
        drop.isOver
          ? "border-accent bg-accent/10 shadow-lg"
          : entry.mealId != null
            ? "border-accent/30 bg-surface shadow-sm"
            : "border-dashed border-border bg-background"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-serif text-lg font-medium">{entry.day}</span>
        {entry.mealId != null ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </div>
      {entry.mealTitle ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-accent/10 px-3 py-2">
            <p className="font-medium text-accent">{entry.mealTitle}</p>
          </div>
          <SearchableSelect
            options={[
              { value: "", label: "No cook assigned" },
              ...people.map((person) => ({
                value: String(person.id),
                label: person.name,
              })),
            ]}
            value={entry.cookerId == null ? "" : String(entry.cookerId)}
            onChange={(value) => onCooker(value ? Number(value) : null)}
            placeholder="Choose cook…"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">Drop a meal here</p>
          {availableMeals.length > 0 ? (
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) onAssign(Number(event.target.value));
              }}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              aria-label={`Assign meal to ${entry.day}`}
            >
              <option value="">Or choose a meal…</option>
              {availableMeals.map((meal) => (
                <option key={meal.id} value={meal.id}>
                  {meal.title}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default function ShoppingWizard({
  meals,
  essentials,
  shopLayout,
  people,
}: {
  meals: MealWithIngredients[];
  essentials: EssentialItemRecord[];
  shopLayout: ShopLayout;
  people: PersonRecord[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("meals");
  const [selectedMealIds, setSelectedMealIds] = useState<number[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlanDay[]>(emptyWeekPlan);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [checkedEssentials, setCheckedEssentials] = useState<string[]>(
    essentials.map((item) => item.name),
  );
  const [extraEssentials, setExtraEssentials] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState("");

  const selectedMeals = meals.filter((meal) =>
    selectedMealIds.includes(meal.id),
  );
  const assignedMealIds = new Set(
    weekPlan.flatMap((entry) => (entry.mealId == null ? [] : [entry.mealId])),
  );
  const availableMeals = selectedMeals.filter(
    (meal) => !assignedMealIds.has(meal.id),
  );

  const assignedDays = weekPlan.filter((entry) => entry.mealId != null);

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

    return mergeIngredients(
      [...mealIngredients, ...essentialIngredients],
      shopLayout,
    );
  }, [assignedDays, meals, checkedEssentials, extraEssentials, shopLayout]);

  function toggleMeal(id: number) {
    const removing = selectedMealIds.includes(id);
    setSelectedMealIds(
      removing
        ? selectedMealIds.filter((mealId) => mealId !== id)
        : [...selectedMealIds, id],
    );
    if (removing) {
      setWeekPlan((current) =>
        current.map((entry) =>
          entry.mealId === id
            ? {
                day: entry.day,
                mealId: null,
                mealTitle: null,
                cookerId: null,
                cookerName: null,
              }
            : entry,
        ),
      );
    }
  }

  function assignMealToDay(day: Weekday, mealId: number) {
    const meal = meals.find((item) => item.id === mealId);
    if (!meal || !selectedMealIds.includes(mealId)) return;

    setWeekPlan((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              day,
              mealId: meal.id,
              mealTitle: meal.title,
              cookerId: null,
              cookerName: null,
            }
          : entry.mealId === mealId
            ? {
                ...entry,
                mealId: null,
                mealTitle: null,
                cookerId: null,
                cookerName: null,
              }
            : entry,
      ),
    );
  }

  function clearDay(day: Weekday) {
    setWeekPlan((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              day,
              mealId: null,
              mealTitle: null,
              cookerId: null,
              cookerName: null,
            }
          : entry,
      ),
    );
  }

  function assignCooker(day: Weekday, personId: number | null) {
    const person = people.find((item) => item.id === personId);
    setWeekPlan((current) =>
      current.map((entry) =>
        entry.day === day
          ? {
              ...entry,
              cookerId: person?.id ?? null,
              cookerName: person?.name ?? null,
            }
          : entry,
      ),
    );
  }

  function onScheduleDragEnd(event: DragEndEvent) {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : "";
    if (!active.startsWith("meal-") || !over.startsWith("day-")) return;
    const mealId = Number(active.replace("meal-", ""));
    const day = over.replace("day-", "") as Weekday;
    assignMealToDay(day, mealId);
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
          <div className="rounded-2xl bg-accent/10 p-5">
            <h2 className="font-serif text-xl font-medium">Build your week</h2>
            <p className="mt-1 text-sm text-muted">
              Drag each meal onto one day, then choose who is cooking. Assigned
              meals leave the available list automatically.
            </p>
          </div>

          {selectedMeals.length === 0 ? (
            <EmptyState>
              No meals selected. Go back and choose meals for this trip.
            </EmptyState>
          ) : (
            <DndContext sensors={sensors} onDragEnd={onScheduleDragEnd}>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,16rem)_1fr]">
                <aside className="rounded-2xl border border-border bg-background p-4">
                  <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
                    Available meals
                  </h2>
                  {availableMeals.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">
                      Every selected meal has been assigned.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {availableMeals.map((meal) => (
                        <DraggableMeal key={meal.id} meal={meal} />
                      ))}
                    </div>
                  )}
                </aside>

                <div>
                  <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">
                    This week
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {weekPlan.map((entry) => (
                      <DayDropZone
                        key={entry.day}
                        entry={entry}
                        people={people}
                        availableMeals={availableMeals}
                        onAssign={(mealId) => assignMealToDay(entry.day, mealId)}
                        onClear={() => clearDay(entry.day)}
                        onCooker={(personId) => assignCooker(entry.day, personId)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </DndContext>
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
                  {entry.cookerName ? (
                    <span className="text-muted"> · {entry.cookerName} cooking</span>
                  ) : null}
                </li>
              ))}
            </ListShell>
          </div>

          <p className="text-sm text-muted">
            {mergedList.length} items · duplicates merged
          </p>

          <div className="space-y-4">
            {Array.from(new Set(mergedList.map((item) => item.sectionName ?? "Other"))).map(
              (sectionName) => (
                <div key={sectionName}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                    {sectionName}
                  </h3>
                  <ListShell>
                    {mergedList
                      .filter((item) => (item.sectionName ?? "Other") === sectionName)
                      .map((item) => (
                        <li
                          key={`${item.name}-${item.unit ?? "none"}-${item.quantity ?? "none"}`}
                          className="px-4 py-3 text-sm"
                        >
                          {item.display}
                        </li>
                      ))}
                  </ListShell>
                </div>
              ),
            )}
          </div>

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
