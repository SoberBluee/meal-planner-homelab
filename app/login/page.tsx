"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button, FieldLabel, TextInput } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });

    if (!response.ok) {
      setError("Wrong PIN. Try again.");
      setLoading(false);
      return;
    }

    const from = searchParams.get("from") || "/shop/new";
    router.replace(from);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-medium tracking-tight">
          Meal Planner
        </h1>
        <p className="mt-2 text-sm text-muted">Enter your household PIN</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-border bg-surface p-6"
      >
        <FieldLabel>PIN</FieldLabel>
        <TextInput
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          placeholder="••••"
          required
          autoFocus
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={loading} className="mt-5 w-full">
          {loading ? "Checking..." : "Continue"}
        </Button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-muted">
          Loading...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
