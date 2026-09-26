"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  required = false,
}: {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHighlight(0);
      window.requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  function selectOption(next: string) {
    onChange(next);
    setOpen(false);
    setQuery("");
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (filtered.length === 0) return;
      setHighlight((current) => (current + 1) % filtered.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (filtered.length === 0) return;
      setHighlight((current) =>
        current <= 0 ? filtered.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const option = filtered[highlight];
      if (option) selectOption(option.value);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onTriggerKeyDown}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-left text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
      >
        <span className={selected ? "text-foreground" : "text-muted/60"}>
          {selected?.label ?? placeholder}
        </span>
        <span className="ml-2 text-muted" aria-hidden>
          ▾
        </span>
      </button>

      {required ? (
        <input
          tabIndex={-1}
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
          value={value}
          onChange={() => {}}
          required
        />
      ) : null}

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="Search…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {filtered.length === 0 ? (
              <li className="px-3.5 py-2.5 text-sm text-muted">No matches</li>
            ) : (
              filtered.map((option, index) => {
                const active = index === highlight;
                const chosen = option.value === value;
                return (
                  <li key={option.value} role="option" aria-selected={chosen}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlight(index)}
                      onClick={() => selectOption(option.value)}
                      className={`flex w-full px-3.5 py-2 text-left text-sm ${
                        active
                          ? "bg-accent/10 text-accent"
                          : chosen
                            ? "bg-background font-medium text-foreground"
                            : "text-foreground hover:bg-background"
                      }`}
                    >
                      {option.label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
