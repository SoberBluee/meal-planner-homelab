import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getShopLayout } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients, shopSections } from "@/lib/schema";

export async function GET(request: Request) {
  return handleRoute(
    "GET /api/shop-layout",
    "shop_layout.view",
    async () => NextResponse.json(await getShopLayout()),
    request,
  );
}

export async function POST(request: Request) {
  return handleRoute(
    "POST /api/shop-layout",
    "shop_section.create",
    async () => {
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim();
      if (!name) {
        return NextResponse.json({ error: "Section name is required" }, { status: 400 });
      }

      const layout = await getShopLayout();
      if (layout.sections.some((section) => section.name.toLowerCase() === name.toLowerCase())) {
        return NextResponse.json({ error: "Section already exists" }, { status: 409 });
      }

      await db.insert(shopSections).values({
        name,
        sortOrder: layout.sections.length,
      });
      await invalidate(CACHE_KEYS.shopLayout);
      logAction({
        action: "shop_section.create",
        outcome: "success",
        summary: `Created shop section "${name}"`,
        name,
      });
      return NextResponse.json(await getShopLayout(), { status: 201 });
    },
    request,
  );
}

export async function PUT(request: Request) {
  return handleRoute(
    "PUT /api/shop-layout",
    "shop_layout.reorder",
    async () => {
      const body = (await request.json()) as {
        sections?: Array<{ id: number; sortOrder: number }>;
        ingredients?: Array<{
          id: number;
          category: string;
          sortOrder: number;
        }>;
      };

      if (!body.sections || !body.ingredients) {
        return NextResponse.json({ error: "Complete layout is required" }, { status: 400 });
      }

      await db.transaction(async (tx) => {
        for (const section of body.sections ?? []) {
          await tx
            .update(shopSections)
            .set({ sortOrder: section.sortOrder })
            .where(eq(shopSections.id, section.id));
        }
        for (const ingredient of body.ingredients ?? []) {
          await tx
            .update(ingredients)
            .set({
              category: ingredient.category,
              sortOrder: ingredient.sortOrder,
            })
            .where(eq(ingredients.id, ingredient.id));
        }
      });

      await invalidate(CACHE_KEYS.shopLayout, CACHE_KEYS.ingredients);
      logAction({
        action: "shop_layout.reorder",
        outcome: "success",
        summary: "Updated shop walking order",
        sectionCount: body.sections.length,
        ingredientCount: body.ingredients.length,
      });
      return NextResponse.json(await getShopLayout());
    },
    request,
  );
}
