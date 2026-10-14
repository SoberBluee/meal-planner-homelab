import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getTrips } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { shoppingTripDays, shoppingTrips } from "@/lib/schema";
import { WEEKDAYS } from "@/lib/types";

export async function GET(request: Request) {
  return handleRoute(
    "GET /api/trips",
    "shop.trip.list",
    async () => NextResponse.json(await getTrips()),
    request,
  );
}

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/trips",
    "shop.trip.save",
    async () => {
      const body = (await request.json()) as {
        weekPlan?: Array<{
          day?: string;
          mealId?: number | null;
          mealTitle?: string | null;
          cookerName?: string | null;
        }>;
        mealCost?: number | null;
        itemCount?: number;
      };

      if (!Array.isArray(body.weekPlan)) {
        return NextResponse.json({ error: "weekPlan is required" }, { status: 400 });
      }

      const days = body.weekPlan
        .filter(
          (entry) =>
            WEEKDAYS.includes(entry.day as (typeof WEEKDAYS)[number]) &&
            entry.mealTitle?.trim(),
        )
        .map((entry) => ({
          day: entry.day as string,
          mealId: entry.mealId ?? null,
          mealTitle: (entry.mealTitle as string).trim(),
          cookerName: entry.cookerName?.trim() || null,
        }));

      const mealCost =
        typeof body.mealCost === "number" && Number.isFinite(body.mealCost)
          ? body.mealCost
          : null;
      const itemCount =
        typeof body.itemCount === "number" && body.itemCount >= 0
          ? Math.floor(body.itemCount)
          : 0;

      const inserted = await db
        .insert(shoppingTrips)
        .values({ mealCost, itemCount })
        .$returningId();

      const tripId = inserted[0]?.id;
      if (!tripId) {
        return NextResponse.json({ error: "Could not save trip" }, { status: 500 });
      }

      if (days.length > 0) {
        await db
          .insert(shoppingTripDays)
          .values(days.map((day) => ({ ...day, tripId })));
      }

      await invalidate(CACHE_KEYS.trips);

      logAction({
        action: "shop.trip.save",
        outcome: "success",
        resource: "trip",
        resourceId: tripId,
        summary: `Saved shopping trip with ${days.length} planned meals`,
        dayCount: days.length,
        itemCount,
      });

      return NextResponse.json({ id: tripId }, { status: 201 });
    },
    request,
  );
}
