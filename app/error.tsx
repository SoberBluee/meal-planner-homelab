"use client";

import { useEffect } from "react";
import { ServerErrorView } from "@/components/ServerErrorView";
import { formatErrorMessage } from "@/lib/errors";

export default function ErrorPage({
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
    console.error("[client error]", message);
    console.error(error);
  }, [error, message]);

  return <ServerErrorView message={message} onReload={reset} />;
}
