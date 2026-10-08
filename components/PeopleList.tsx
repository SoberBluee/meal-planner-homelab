"use client";

import { useState } from "react";
import type { PersonRecord } from "@/lib/types";
import { Button, EmptyState, TextInput } from "./ui";

export default function PeopleList({ initialPeople }: { initialPeople: PersonRecord[] }) {
  const [people, setPeople] = useState(initialPeople);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  async function addPerson(event: React.FormEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const response = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as PersonRecord[] & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not add person");
      return;
    }
    setPeople(body);
    setNewName("");
    setError("");
  }

  async function renamePerson(person: PersonRecord) {
    const name = (editing[person.id] ?? person.name).trim();
    if (!name || name === person.name) return;
    const response = await fetch(`/api/people/${person.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as PersonRecord[] & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not rename person");
      return;
    }
    setPeople(body);
    setEditing((current) => {
      const next = { ...current };
      delete next[person.id];
      return next;
    });
  }

  async function deletePerson(id: number) {
    const response = await fetch(`/api/people/${id}`, { method: "DELETE" });
    const body = (await response.json()) as PersonRecord[] & { error?: string };
    if (!response.ok) {
      setError(body.error ?? "Could not remove person");
      return;
    }
    setPeople(body);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={addPerson} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row">
        <TextInput
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Name…"
          aria-label="Person name"
        />
        <Button type="submit">Add person</Button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {people.length === 0 ? (
        <EmptyState>Add the people who can cook meals.</EmptyState>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {people.map((person) => (
            <li key={person.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <TextInput
                value={editing[person.id] ?? person.name}
                onChange={(event) =>
                  setEditing((current) => ({ ...current, [person.id]: event.target.value }))
                }
                aria-label={`Name for ${person.name}`}
              />
              <Button type="button" variant="secondary" size="sm" onClick={() => void renamePerson(person)}>
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => void deletePerson(person.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
