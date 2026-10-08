"use client";

/* eslint-disable react-hooks/refs -- dnd-kit exposes reactive drag state through refs */

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  IngredientRecord,
  ShopLayout,
  ShopSectionRecord,
} from "@/lib/types";
import { Button, EmptyState, TextInput } from "./ui";

const sectionId = (id: number) => `section-${id}`;
const ingredientId = (id: number) => `ingredient-${id}`;

function SortableIngredient({
  item,
  sections,
  first,
  last,
  onMove,
  onMoveSection,
}: {
  item: IngredientRecord;
  sections: ShopSectionRecord[];
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onMoveSection: (category: string) => void;
}) {
  const sortable = useSortable({ id: ingredientId(item.id) });
  return (
    <li
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 ${
        sortable.isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        aria-label={`Move ${item.name}`}
        className="cursor-grab touch-none text-muted active:cursor-grabbing"
        {...sortable.attributes}
        {...sortable.listeners}
      >
        ⠿
      </button>
      <span className="min-w-32 flex-1 text-sm font-medium">{item.name}</span>
      <select
        value={item.category}
        onChange={(event) => onMoveSection(event.target.value)}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
        aria-label={`Section for ${item.name}`}
      >
        {sections.map((section) => (
          <option key={section.id} value={section.name}>
            {section.name}
          </option>
        ))}
      </select>
      <Button type="button" variant="ghost" size="sm" disabled={first} onClick={() => onMove(-1)}>
        ↑
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={last} onClick={() => onMove(1)}>
        ↓
      </Button>
    </li>
  );
}

function SortableSection({
  section,
  items,
  sections,
  first,
  last,
  onSectionMove,
  onItemMove,
  onItemSection,
  onRename,
  onDelete,
}: {
  section: ShopSectionRecord;
  items: IngredientRecord[];
  sections: ShopSectionRecord[];
  first: boolean;
  last: boolean;
  onSectionMove: (direction: -1 | 1) => void;
  onItemMove: (id: number, direction: -1 | 1) => void;
  onItemSection: (id: number, category: string) => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const sortable = useSortable({ id: sectionId(section.id) });
  const [name, setName] = useState(section.name);

  return (
    <section
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={`rounded-2xl border border-border bg-surface p-4 ${
        sortable.isDragging ? "opacity-60 shadow-xl" : ""
      }`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={`Move ${section.name} section`}
          className="cursor-grab touch-none text-xl text-muted active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ⠿
        </button>
        <TextInput
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="min-w-40 flex-1"
          aria-label="Section name"
        />
        <Button type="button" variant="secondary" size="sm" onClick={() => void onRename(name)}>
          Rename
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={first} onClick={() => onSectionMove(-1)}>
          ↑
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={last} onClick={() => onSectionMove(1)}>
          ↓
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => void onDelete()}>
          Remove
        </Button>
      </div>

      <SortableContext
        items={items.map((item) => ingredientId(item.id))}
        strategy={verticalListSortingStrategy}
      >
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted">
            Drop ingredients here
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <SortableIngredient
                key={item.id}
                item={item}
                sections={sections}
                first={index === 0}
                last={index === items.length - 1}
                onMove={(direction) => onItemMove(item.id, direction)}
                onMoveSection={(category) => onItemSection(item.id, category)}
              />
            ))}
          </ul>
        )}
      </SortableContext>
    </section>
  );
}

export default function ShopLayoutEditor({ initialLayout }: { initialLayout: ShopLayout }) {
  const [sections, setSections] = useState(initialLayout.sections);
  const [ingredients, setIngredients] = useState(initialLayout.ingredients);
  const [newSection, setNewSection] = useState("");
  const [status, setStatus] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function itemsFor(sectionName: string, source = ingredients) {
    return source
      .filter((item) => item.category === sectionName)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  function normalizeItems(source: IngredientRecord[]) {
    return source.map((item) => ({
      ...item,
      sortOrder: itemsFor(item.category, source).findIndex((candidate) => candidate.id === item.id),
    }));
  }

  function moveSection(id: number, direction: -1 | 1) {
    const index = sections.findIndex((section) => section.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sections.length) return;
    setSections(arrayMove(sections, index, target));
  }

  function moveItem(id: number, direction: -1 | 1) {
    const item = ingredients.find((candidate) => candidate.id === id);
    if (!item) return;
    const group = itemsFor(item.category);
    const index = group.findIndex((candidate) => candidate.id === id);
    const target = index + direction;
    if (target < 0 || target >= group.length) return;
    const reordered = arrayMove(group, index, target);
    setIngredients(
      ingredients.map((candidate) => {
        const nextIndex = reordered.findIndex((entry) => entry.id === candidate.id);
        return nextIndex >= 0 ? { ...candidate, sortOrder: nextIndex } : candidate;
      }),
    );
  }

  function moveItemToSection(id: number, category: string) {
    const next = ingredients.map((item) =>
      item.id === id
        ? { ...item, category, sortOrder: itemsFor(category).length }
        : item,
    );
    setIngredients(normalizeItems(next));
  }

  function onDragEnd(event: DragEndEvent) {
    const active = String(event.active.id);
    const over = event.over ? String(event.over.id) : null;
    if (!over || active === over) return;

    if (active.startsWith("section-") && over.startsWith("section-")) {
      const from = sections.findIndex((item) => sectionId(item.id) === active);
      const to = sections.findIndex((item) => sectionId(item.id) === over);
      if (from >= 0 && to >= 0) setSections(arrayMove(sections, from, to));
      return;
    }

    if (!active.startsWith("ingredient-")) return;
    const activeId = Number(active.replace("ingredient-", ""));
    const activeItem = ingredients.find((item) => item.id === activeId);
    if (!activeItem) return;

    let targetCategory: string | undefined;
    let targetIndex: number | undefined;
    if (over.startsWith("section-")) {
      targetCategory = sections.find((item) => sectionId(item.id) === over)?.name;
    } else if (over.startsWith("ingredient-")) {
      const overId = Number(over.replace("ingredient-", ""));
      const overItem = ingredients.find((item) => item.id === overId);
      targetCategory = overItem?.category;
      if (overItem) targetIndex = itemsFor(overItem.category).findIndex((item) => item.id === overId);
    }
    if (!targetCategory) return;

    const withoutActive = ingredients.filter((item) => item.id !== activeId);
    const targetItems = itemsFor(targetCategory, withoutActive);
    targetItems.splice(targetIndex ?? targetItems.length, 0, {
      ...activeItem,
      category: targetCategory,
    });
    const next = withoutActive.map((item) => {
      if (item.category !== targetCategory) return item;
      return { ...item, sortOrder: targetItems.findIndex((candidate) => candidate.id === item.id) };
    });
    next.push({
      ...activeItem,
      category: targetCategory,
      sortOrder: targetItems.findIndex((candidate) => candidate.id === activeId),
    });
    setIngredients(normalizeItems(next));
  }

  async function saveLayout() {
    setStatus("Saving…");
    const response = await fetch("/api/shop-layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections: sections.map((section, sortOrder) => ({ id: section.id, sortOrder })),
        ingredients: normalizeItems(ingredients).map((item) => ({
          id: item.id,
          category: item.category,
          sortOrder: item.sortOrder,
        })),
      }),
    });
    if (!response.ok) {
      const body = (await response.json()) as { error?: string };
      setStatus(body.error ?? "Could not save layout");
      return;
    }
    const layout = (await response.json()) as ShopLayout;
    setSections(layout.sections);
    setIngredients(layout.ingredients);
    setStatus("Saved");
  }

  async function createSection(event: React.FormEvent) {
    event.preventDefault();
    const name = newSection.trim();
    if (!name) return;
    const response = await fetch("/api/shop-layout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as ShopLayout & { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Could not create section");
      return;
    }
    setSections(body.sections);
    setIngredients(body.ingredients);
    setNewSection("");
  }

  async function renameSection(id: number, name: string) {
    const response = await fetch(`/api/shop-layout/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as ShopLayout & { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Could not rename section");
      return;
    }
    setSections(body.sections);
    setIngredients(body.ingredients);
  }

  async function deleteSection(id: number) {
    const response = await fetch(`/api/shop-layout/${id}`, { method: "DELETE" });
    const body = (await response.json()) as ShopLayout & { error?: string };
    if (!response.ok) {
      setStatus(body.error ?? "Could not remove section");
      return;
    }
    setSections(body.sections);
    setIngredients(body.ingredients);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createSection} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row">
        <TextInput
          value={newSection}
          onChange={(event) => setNewSection(event.target.value)}
          placeholder="New shop section…"
          aria-label="New shop section"
        />
        <Button type="submit">Add section</Button>
      </form>

      {sections.length === 0 ? (
        <EmptyState>Add your first shop section to organise ingredients.</EmptyState>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={sections.map((section) => sectionId(section.id))}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((section, index) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  items={itemsFor(section.name)}
                  sections={sections}
                  first={index === 0}
                  last={index === sections.length - 1}
                  onSectionMove={(direction) => moveSection(section.id, direction)}
                  onItemMove={moveItem}
                  onItemSection={moveItemToSection}
                  onRename={(name) => renameSection(section.id, name)}
                  onDelete={() => deleteSection(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="sticky bottom-4 flex items-center gap-3 rounded-xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <Button type="button" onClick={() => void saveLayout()}>
          Save walking order
        </Button>
        {status ? <span className="text-sm text-muted">{status}</span> : null}
      </div>
    </div>
  );
}
