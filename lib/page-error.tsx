import { ServerErrorView } from "@/components/ServerErrorView";
import { formatErrorMessage, logServerError } from "@/lib/errors";

export function renderPageError(error: unknown, context: string) {
  logServerError(error, context);
  return <ServerErrorView message={formatErrorMessage(error)} />;
}
