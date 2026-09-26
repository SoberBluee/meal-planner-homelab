"use client";

import { useState } from "react";
import {
  INGREDIENT_CATEGORIES,
  type IngredientRecord,
} from "@/lib/types";
import {
  Button,
  EmptyState,
  FieldLabel,
  ListShell,
  Select,
  TextInput,
} from "./ui";

export default function IngredientsList({
  initialItems,
}: {
  initialItems: IngredientRecord[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>(
    INGREDIENT_CATEGORIES[0],
  );
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState("");

  async function refreshItems() {
    const response = await fetch("/api/ingredients");
    const data = (await response.json()) as IngredientRecord[];
    setItems(
      [...data].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    );
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const name = newName.trim();
    if (!name) {
      setError("Name is required");
      return;
    }
    if (
      !INGREDIENT_CATEGORIES.includes(
        newCategory as (typeof INGREDIENT_CATEGORIES)[number],
      )
    ) {
      setError("Pick a category");
      return;
    }

    const response = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: newCategory,
        price: newPrice.trim() ? Number.parseFloat(newPrice) : null,
      }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not add item");
      return;
    }

    setNewName("");
    setNewCategory(INGREDIENT_CATEGORIES[0]);
    setNewPrice("");
    await refreshItems();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    await refreshItems();
  }

  return (
    <div className="space-y-8">
      <form
        noValidate
        onSubmit={addItem}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[2fr_1.4fr_1fr]">
          <div>
            <FieldLabel>Ingredient</FieldLabel>
            <TextInput
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Milk, bread, cheese..."
            />
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <Select
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
            >
              {INGREDIENT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Price (optional)</FieldLabel>
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(event) => setNewPrice(event.target.value)}
              placeholder="1.20"
            />
          </div>
        </div>
        <Button type="submit" className="w-full sm:w-fit">
          Add
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {items.length === 0 ? (
        <EmptyState>
          No ingredients yet. These are the ingredients you need to make your
          meals.
        </EmptyState>
      ) : (
        <ListShell>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5"
            >
              <div>
                <span className="font-medium">{item.name}</span>
                <p className="mt-0.5 text-sm text-muted">
                  {item.category}
                  {item.price != null
                    ? ` · £${item.price.toFixed(2)}`
                    : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteItem(item.id)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ListShell>
      )}
    </div>
  );
}
