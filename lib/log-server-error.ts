import "server-only";

import { formatErrorMessage } from "@/lib/errors";
import { logAction } from "@/lib/logger";

export function logServerError(error: unknown, context?: string): void {
  const err =
    error instanceof Error ? error : new Error(formatErrorMessage(error));
  logAction(
    {
      action: "server.error",
      outcome: "failure",
      summary: context
        ? `Server error in ${context}`
        : "Unhandled server error",
      context,
      err,
      message: formatErrorMessage(error),
    },
    "error",
  );
}
