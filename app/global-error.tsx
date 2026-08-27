"use client";

import { useEffect } from "react";
import { ServerErrorView } from "@/components/ServerErrorView";
import { formatErrorMessage } from "@/lib/errors";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = [
    formatErrorMessage(error),
    error.digest ? `digest=${error.digest}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  useEffect(() => {
    console.error("[global error]", message);
    console.error(error);
  }, [error, message]);

  return (
    <html lang="en">
      <body className="min-h-full bg-background font-sans text-foreground">
        <ServerErrorView message={message} onReload={reset} />
      </body>
    </html>
  );
}
