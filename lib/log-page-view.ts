import "server-only";

import { logAction } from "@/lib/logger";

export function logPageView(
  path: string,
  options: {
    action: string;
    extra?: Record<string, unknown>;
  },
): void {
  logAction({
    action: options.action,
    outcome: "success",
    summary: `Viewed ${path}`,
    path,
    ...options.extra,
  });
}
