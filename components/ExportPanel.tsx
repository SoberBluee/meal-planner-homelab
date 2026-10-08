"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ShoppingDraft } from "@/lib/types";
import { SHOPPING_DRAFT_KEY } from "@/lib/types";
import { Button, EmptyState } from "./ui";

export default function ExportPanel() {
  const [draft, setDraft] = useState<ShoppingDraft | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(SHOPPING_DRAFT_KEY);
    if (!raw) return;
    queueMicrotask(() => setDraft(JSON.parse(raw) as ShoppingDraft));
  }, []);

  async function copyList() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.listText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function shareList() {
    if (!draft) return;
    setShareError("");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Shopping list",
          text: draft.listText,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setShareError("Share failed. Try copy instead.");
        return;
      }
    }

    await copyList();
    setShareError("List copied — paste into Apple Notes.");
  }

  if (!draft) {
    return (
      <div className="space-y-4">
        <EmptyState>No list found. Start a new shopping trip.</EmptyState>
        <Link href="/shop/new">
          <Button type="button">New trip</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-5 text-sm leading-relaxed whitespace-pre-wrap">
        {draft.listText}
      </pre>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={copyList}>
          {copied ? "Copied" : "Copy as text"}
        </Button>
        <Button type="button" variant="secondary" onClick={shareList}>
          Share to Notes
        </Button>
        <Link href="/shop/new">
          <Button type="button" variant="secondary">
            New trip
          </Button>
        </Link>
      </div>

      {shareError ? (
        <p className="text-sm text-muted">{shareError}</p>
      ) : (
        <p className="text-sm text-muted">
          On iPhone, Share opens the sheet to send straight to Notes. On desktop, copy and paste.
        </p>
      )}
    </div>
  );
}
