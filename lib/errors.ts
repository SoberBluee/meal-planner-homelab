type ErrorLike = {
  message?: string;
  name?: string;
  cause?: unknown;
  code?: string;
  errno?: number;
  hostname?: string;
  sqlMessage?: string;
  sqlState?: string;
};

function asErrorLike(error: unknown): ErrorLike | null {
  if (!error || typeof error !== "object") return null;
  return error as ErrorLike;
}

export function formatErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;

  const parts: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();

  while (current && !seen.has(current)) {
    seen.add(current);
    const like = asErrorLike(current);
    if (!like) {
      parts.push(String(current));
      break;
    }

    const detail = [
      like.sqlMessage,
      like.message,
      like.code ? `code=${like.code}` : null,
      like.hostname ? `hostname=${like.hostname}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    if (detail) parts.push(detail);
    current = like.cause;
  }

  return parts.join("\n") || "Unknown error";
}
