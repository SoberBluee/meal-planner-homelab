"use client";

import { Button } from "./ui";

export function ServerErrorView({
  message,
  onReload,
}: {
  message: string;
  onReload?: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5 py-12">
      <h1 className="font-serif text-3xl font-medium tracking-tight">
        This page couldn&apos;t load
      </h1>
      <p className="mt-2 text-sm text-muted">
        A server error occurred. Reload to try again.
      </p>
      <pre className="mt-6 overflow-x-auto whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {message}
      </pre>
      <Button
        type="button"
        className="mt-6 w-fit"
        onClick={onReload ?? (() => window.location.reload())}
      >
        Reload
      </Button>
    </main>
  );
}
