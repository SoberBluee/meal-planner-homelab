"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  IngredientFormRow,
  IngredientRecord,
  MealWithIngredients,
} from "@/lib/types";
import { Button, FieldLabel, Select, TextInput } from "./ui";

const emptyIngredient = (): IngredientFormRow => ({
  name: "",
  quantity: "",
  unit: "",
});

function ingredientsFromMeal(meal?: MealWithIngredients): IngredientFormRow[] {
  if (!meal?.ingredients.length) return [emptyIngredient()];
  return meal.ingredients.map((item) => ({
    name: item.name,
    quantity: item.quantity != null ? String(item.quantity) : "",
    unit: item.unit ?? "",
  }));
}

export default function MealForm({
  meal,
  onSaved,
  onCancel,
}: {
  meal?: MealWithIngredients;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(meal?.title ?? "");
  const [price, setPrice] = useState(
    meal?.price != null ? String(meal.price) : "",
  );
  const [ingredients, setIngredients] = useState<IngredientFormRow[]>(
    ingredientsFromMeal(meal),
  );
  const [catalog, setCatalog] = useState<IngredientRecord[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const response = await fetch("/api/ingredients");
        if (!response.ok) {
          if (!cancelled) {
            setError("Could not load ingredients catalog");
            setCatalogLoaded(true);
          }
          return;
        }
        const data = (await response.json()) as IngredientRecord[];
        if (!cancelled) {
          setCatalog(data);
          setCatalogLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load ingredients catalog");
          setCatalogLoaded(true);
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateIngredient(
    index: number,
    field: keyof IngredientFormRow,
    value: string,
  ) {
    setIngredients((rows) =>
      rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    if (catalog.length === 0) {
      setError("Add ingredients on the Ingredients page before creating a meal.");
      setSaving(false);
      return;
    }

    const payload = {
      title,
      price: price.trim() ? Number.parseFloat(price) : null,
      ingredients: ingredients
        .filter((row) => row.name.trim())
        .map((row) => ({
          name: row.name,
          quantity: row.quantity.trim()
            ? Number.parseFloat(row.quantity)
            : null,
          unit: row.unit.trim() || null,
        })),
    };

    const response = await fetch(
      meal ? `/api/meals/${meal.id}` : "/api/meals",
      {
        method: meal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not save meal");
      setSaving(false);
      return;
    }

    onSaved();
    setSaving(false);
  }

  const catalogNames = new Set(catalog.map((item) => item.name));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <FieldLabel>Meal title</FieldLabel>
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Chicken stir fry"
            required
          />
        </div>
        <div>
          <FieldLabel>Price (optional)</FieldLabel>
          <TextInput
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="12.50"
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <FieldLabel>Ingredients</FieldLabel>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIngredients((rows) => [...rows, emptyIngredient()])}
            disabled={catalog.length === 0}
          >
            Add row
          </Button>
        </div>

        {catalogLoaded && catalog.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-sm text-muted">
            No ingredients in the catalog yet.{" "}
            <Link href="/ingredients" className="font-medium text-accent hover:underline">
              Add some on the Ingredients page
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="space-y-2">
            {ingredients.map((row, index) => {
              const orphanName =
                row.name && !catalogNames.has(row.name) ? row.name : null;

              return (
                <div
                  key={`ingredient-${index}`}
                  className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-center"
                >
                  <Select
                    value={row.name}
                    onChange={(event) =>
                      updateIngredient(index, "name", event.target.value)
                    }
                    required
                  >
                    <option value="" disabled>
                      Select ingredient
                    </option>
                    {orphanName ? (
                      <option value={orphanName}>{orphanName}</option>
                    ) : null}
                    {catalog.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                  <TextInput
                    value={row.quantity}
                    onChange={(event) =>
                      updateIngredient(index, "quantity", event.target.value)
                    }
                    placeholder="Qty"
                    type="number"
                    min="0"
                    step="any"
                  />
                  <TextInput
                    value={row.unit}
                    onChange={(event) =>
                      updateIngredient(index, "unit", event.target.value)
                    }
                    placeholder="g, ml, pack"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setIngredients((rows) =>
                        rows.length === 1
                          ? [emptyIngredient()]
                          : rows.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <Button
          type="submit"
          disabled={saving || (catalogLoaded && catalog.length === 0)}
        >
          {saving ? "Saving..." : meal ? "Save changes" : "Add meal"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
