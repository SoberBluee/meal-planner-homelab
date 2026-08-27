import { NextResponse } from "next/server";
import { formatErrorMessage, logServerError } from "@/lib/errors";

export async function handleRoute<T>(
  context: string,
  fn: () => Promise<T>,
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    logServerError(error, context);
    return NextResponse.json(
      { error: formatErrorMessage(error) },
      { status: 500 },
    );
  }
}
