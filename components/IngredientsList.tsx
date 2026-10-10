"use client";

import { useState } from "react";
import type { IngredientRecord, ShopSectionRecord } from "@/lib/types";
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
  sections,
}: {
  initialItems: IngredientRecord[];
  sections: ShopSectionRecord[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(sections[0]?.name ?? "");
  const [newPrice, setNewPrice] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (!sections.some((section) => section.name === newCategory)) {
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
    setNewCategory(sections[0]?.name ?? "");
    setNewPrice("");
    await refreshItems();
  }

  function startEdit(item: IngredientRecord) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price != null ? String(item.price) : "");
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  async function saveEdit(id: number) {
    setEditError("");

    const name = editName.trim();
    if (!name) {
      setEditError("Name is required");
      return;
    }
    if (!sections.some((section) => section.name === editCategory)) {
      setEditError("Pick a category");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/ingredients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category: editCategory,
        price: editPrice.trim() ? Number.parseFloat(editPrice) : null,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setEditError(data.error ?? "Could not save ingredient");
      return;
    }

    setEditingId(null);
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
              {sections.map((section) => (
                <option key={section.id} value={section.name}>
                  {section.name}
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
          {items.map((item) =>
            editingId === item.id ? (
              <li key={item.id} className="px-4 py-3.5">
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveEdit(item.id);
                  }}
                  className="space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-[2fr_1.4fr_1fr]">
                    <div>
                      <FieldLabel>Ingredient</FieldLabel>
                      <TextInput
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        autoFocus
                      />
                    </div>
                    <div>
                      <FieldLabel>Category</FieldLabel>
                      <Select
                        value={editCategory}
                        onChange={(event) => setEditCategory(event.target.value)}
                      >
                        {sections.some((section) => section.name === editCategory) ? null : (
                          <option value={editCategory}>{editCategory}</option>
                        )}
                        {sections.map((section) => (
                          <option key={section.id} value={section.name}>
                            {section.name}
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
                        value={editPrice}
                        onChange={(event) => setEditPrice(event.target.value)}
                        placeholder="1.20"
                      />
                    </div>
                  </div>
                  {editError ? (
                    <p className="text-sm text-red-600">{editError}</p>
                  ) : null}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
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
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ),
          )}
        </ListShell>
      )}
    </div>
  );
}
