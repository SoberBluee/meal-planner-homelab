import type { IngredientInput, MergedIngredient } from "./schema";

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function normalizeUnit(unit?: string | null): string | undefined {
  if (!unit) return undefined;
  const trimmed = unit.trim().toLowerCase();
  return trimmed || undefined;
}

function formatDisplay(
  name: string,
  quantity?: number,
  unit?: string,
): string {
  const capitalized =
    name.trim().charAt(0).toUpperCase() + name.trim().slice(1);

  if (quantity != null && unit) {
    return `${quantity}${unit} ${capitalized}`;
  }
  if (quantity != null) {
    return `${quantity} ${capitalized}`;
  }
  return capitalized;
}

type MergeBucket = {
  name: string;
  quantity?: number;
  unit?: string;
};

export function mergeIngredients(
  ingredients: IngredientInput[],
): MergedIngredient[] {
  const buckets = new Map<string, MergeBucket[]>();

  for (const ingredient of ingredients) {
    const name = ingredient.name.trim();
    if (!name) continue;

    const key = normalizeName(name);
    const unit = normalizeUnit(ingredient.unit);
    const quantity =
      ingredient.quantity != null && !Number.isNaN(ingredient.quantity)
        ? ingredient.quantity
        : undefined;

    const existing = buckets.get(key) ?? [];
    const match = existing.find((item) => item.unit === unit);

    if (match) {
      if (quantity != null && match.quantity != null) {
        match.quantity += quantity;
      } else if (quantity != null && match.quantity == null) {
        match.quantity = quantity;
      }
    } else {
      existing.push({ name, quantity, unit });
    }

    buckets.set(key, existing);
  }

  const merged: MergedIngredient[] = [];

  for (const items of buckets.values()) {
    for (const item of items) {
      merged.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        display: formatDisplay(item.name, item.quantity, item.unit),
      });
    }
  }

  return merged.sort((a, b) =>
    a.display.localeCompare(b.display, undefined, { sensitivity: "base" }),
  );
}

export function formatShoppingListText(
  items: MergedIngredient[],
  options?: {
    mealCost?: number | null;
    date?: Date;
    weekPlan?: Array<{ day: string; mealTitle: string | null }>;
  },
): string {
  const date = options?.date ?? new Date();
  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const lines: string[] = [];

  if (options?.weekPlan && options.weekPlan.length > 0) {
    lines.push("This week");
    for (const entry of options.weekPlan) {
      lines.push(
        entry.mealTitle
          ? `${entry.day} — ${entry.mealTitle}`
          : `${entry.day} —`,
      );
    }
    lines.push("");
  }

  lines.push(`Shopping list — ${dateStr}`, "");

  for (const item of items) {
    lines.push(`□ ${item.display}`);
  }

  if (options?.mealCost != null) {
    lines.push("");
    lines.push(`Estimated meal cost: £${options.mealCost.toFixed(2)}`);
  }

  return lines.join("\n");
}
