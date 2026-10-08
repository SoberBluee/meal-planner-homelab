import type { IngredientInput, MergedIngredient } from "./schema";
import type { IngredientRecord, ShopSectionRecord } from "./types";

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
  layout?: {
    ingredients: IngredientRecord[];
    sections: ShopSectionRecord[];
  },
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
      const catalogItem = layout?.ingredients.find(
        (candidate) => normalizeName(candidate.name) === normalizeName(item.name),
      );
      const fallbackSection = layout?.sections.find(
        (section) => section.name.toLowerCase() === "other",
      );
      const section = catalogItem
        ? layout?.sections.find((candidate) => candidate.name === catalogItem.category)
        : fallbackSection;
      const displayName = catalogItem?.printName || item.name;
      merged.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        display: formatDisplay(displayName, item.quantity, item.unit),
        sectionName: section?.name ?? (layout ? "Other" : undefined),
        sectionOrder:
          section?.sortOrder ??
          (layout ? Math.max(-1, ...layout.sections.map((value) => value.sortOrder)) + 1 : undefined),
        itemOrder: catalogItem?.sortOrder,
      });
    }
  }

  return merged.sort((a, b) => {
    const sectionDifference =
      (a.sectionOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.sectionOrder ?? Number.MAX_SAFE_INTEGER);
    if (sectionDifference !== 0) return sectionDifference;
    const itemDifference =
      (a.itemOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.itemOrder ?? Number.MAX_SAFE_INTEGER);
    if (itemDifference !== 0) return itemDifference;
    return a.display.localeCompare(b.display, undefined, { sensitivity: "base" });
  });
}

export function formatShoppingListText(
  items: MergedIngredient[],
  options?: {
    mealCost?: number | null;
    date?: Date;
    weekPlan?: Array<{
      day: string;
      mealTitle: string | null;
      cookerName?: string | null;
    }>;
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
          ? `${entry.day} — ${entry.mealTitle}${
              entry.cookerName ? ` · ${entry.cookerName} cooking` : ""
            }`
          : `${entry.day} —`,
      );
    }
    lines.push("");
  }

  lines.push(`Shopping list — ${dateStr}`, "");

  let currentSection: string | undefined;
  for (const item of items) {
    if (item.sectionName && item.sectionName !== currentSection) {
      if (currentSection) lines.push("");
      currentSection = item.sectionName;
      lines.push(currentSection);
    }
    lines.push(`□ ${item.display}`);
  }

  if (options?.mealCost != null) {
    lines.push("");
    lines.push(`Estimated meal cost: £${options.mealCost.toFixed(2)}`);
  }

  return lines.join("\n");
}
