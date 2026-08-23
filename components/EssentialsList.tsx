"use client";

import { useState } from "react";
import type { EssentialItemRecord } from "@/lib/types";
import { Button, EmptyState, FieldLabel, ListShell, TextInput } from "./ui";

export default function EssentialsList({
  initialItems,
}: {
  initialItems: EssentialItemRecord[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function refreshItems() {
    const response = await fetch("/api/essentials");
    const data = (await response.json()) as EssentialItemRecord[];
    setItems(data);
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const response = await fetch("/api/essentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Could not add item");
      return;
    }

    setNewName("");
    await refreshItems();
  }

  async function deleteItem(id: number) {
    await fetch(`/api/essentials/${id}`, { method: "DELETE" });
    await refreshItems();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addItem}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <FieldLabel>Add essential</FieldLabel>
          <TextInput
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Milk, bread, cheese..."
            required
          />
        </div>
        <Button type="submit" className="sm:mb-0.5">
          Add
        </Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {items.length === 0 ? (
        <EmptyState>
          No essentials yet. These pre-fill every shopping trip.
        </EmptyState>
      ) : (
        <ListShell>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5"
            >
              <span className="font-medium">{item.name}</span>
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
