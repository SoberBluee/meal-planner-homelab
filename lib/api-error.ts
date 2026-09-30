import { NextResponse } from "next/server";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/log-server-error";
import { logAction, type LogOutcome } from "@/lib/logger";

function httpFromRequest(request: Request | undefined, fallbackPath: string) {
  if (request) {
    return {
      method: request.method,
      path: new URL(request.url).pathname,
    };
  }
  return { method: "GET", path: fallbackPath };
}

function outcomeForStatus(status: number): LogOutcome {
  if (status === 404) return "not_found";
  if (status === 401 || status === 403) return "denied";
  if (status >= 400) return "failure";
  return "success";
}

export async function handleRoute<T>(
  context: string,
  action: string,
  fn: () => Promise<T>,
  request?: Request,
): Promise<T | NextResponse> {
  const start = Date.now();
  const http = httpFromRequest(request, context);

  logAction({
    action: `${action}.request`,
    outcome: "success",
    summary: `Handling ${http.method} ${http.path}`,
    http,
  });

  try {
    const result = await fn();
    const durationMs = Date.now() - start;

    if (result instanceof NextResponse) {
      const status = result.status;
      const outcome = outcomeForStatus(status);
      logAction(
        {
          action,
          outcome,
          summary: `${http.method} ${http.path} completed with ${status}`,
          http: { ...http, status, durationMs },
        },
        status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      );
      return result;
    }

    logAction({
      action,
      outcome: "success",
      summary: `${http.method} ${http.path} completed`,
      http: { ...http, status: 200, durationMs },
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - start;
    logServerError(error, context);
    logAction(
      {
        action,
        outcome: "failure",
        summary: `${http.method} ${http.path} failed with exception`,
        http: { ...http, status: 500, durationMs },
        message: formatErrorMessage(error),
      },
      "error",
    );
    return NextResponse.json(
      { error: formatErrorMessage(error) },
      { status: 500 },
    );
  }
}
