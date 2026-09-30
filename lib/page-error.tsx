import { ServerErrorView } from "@/components/ServerErrorView";
import { formatErrorMessage } from "@/lib/errors";
import { logServerError } from "@/lib/log-server-error";

export function renderPageError(error: unknown, context: string) {
  logServerError(error, context);
  return <ServerErrorView message={formatErrorMessage(error)} />;
}
