import "server-only";

import pino, { type Logger } from "pino";
import { DailyAccessLogStream, getLogDir } from "@/lib/log-daily-stream";

const REDACT_KEYS = new Set([
  "pin",
  "password",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
]);

export type LogOutcome = "success" | "failure" | "denied" | "not_found";

export type LogActionFields = {
  action: string;
  outcome?: LogOutcome;
  summary?: string;
  resource?: string;
  resourceId?: string | number;
  http?: {
    method: string;
    path: string;
    status?: number;
    durationMs?: number;
  };
  [key: string]: unknown;
};

declare global {
  var __mealPlannerLogger: Logger | undefined;
}

function createLogger(): Logger {
  const logDir = getLogDir();
  const dailyStream = new DailyAccessLogStream(logDir);

  return pino(
    {
      level: process.env.LOG_LEVEL || "info",
      base: { service: "meal-planner" },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream([
      { stream: process.stdout },
      { stream: dailyStream },
    ]),
  );
}

if (!globalThis.__mealPlannerLogger) {
  globalThis.__mealPlannerLogger = createLogger();
}

export const logger: Logger = globalThis.__mealPlannerLogger;

export function childLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

export function sanitizeForLog(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item));
  }
  if (typeof value !== "object") {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (REDACT_KEYS.has(key.toLowerCase())) {
      out[key] = "[REDACTED]";
    } else {
      out[key] = sanitizeForLog(val);
    }
  }
  return out;
}

export function logAction(fields: LogActionFields, level: "info" | "warn" | "error" = "info"): void {
  const payload = sanitizeForLog(fields) as LogActionFields;
  logger[level](payload);
}

export { getLogDir };
