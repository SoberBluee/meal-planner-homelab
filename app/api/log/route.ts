import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { logAction, sanitizeForLog } from "@/lib/logger";

const ALLOWED_CLIENT_ACTIONS = new Set([
  "shop.trip.complete",
  "shop.wizard.step",
]);

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/log",
    "client.event",
    async () => {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const action = typeof body.action === "string" ? body.action.trim() : "";
      if (!action || !ALLOWED_CLIENT_ACTIONS.has(action)) {
        return NextResponse.json({ error: "Unknown or missing action" }, { status: 400 });
      }

      const metadata = { ...body };
      delete metadata.action;
      const sanitizedMetadata = sanitizeForLog(metadata) as Record<string, unknown>;

      logAction({
        action,
        outcome: "success",
        summary: clientEventSummary(action, sanitizedMetadata),
        source: "client",
        ...sanitizedMetadata,
      });

      return new NextResponse(null, { status: 204 });
    },
    request,
  );
}

function clientEventSummary(
  action: string,
  metadata: Record<string, unknown>,
): string {
  if (action === "shop.trip.complete") {
    const meals = metadata.selectedMealCount ?? "?";
    const essentials = metadata.checkedEssentialsCount ?? "?";
    return `Completed shopping trip (${meals} meals, ${essentials} essentials checked)`;
  }
  if (action === "shop.wizard.step") {
    const step = metadata.step ?? "unknown";
    return `Shopping wizard on step "${step}"`;
  }
  return `Client event: ${action}`;
}
