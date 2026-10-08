import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { handleRoute } from "@/lib/api-error";
import { db } from "@/lib/db";
import { logAction } from "@/lib/logger";
import { getShopLayout } from "@/lib/queries";
import { CACHE_KEYS, invalidate } from "@/lib/redis";
import { ingredients, shopSections } from "@/lib/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleRoute(
    `PUT /api/shop-layout/${id}`,
    "shop_section.rename",
    async () => {
      const sectionId = Number.parseInt(id, 10);
      const body = (await request.json()) as { name?: string };
      const name = body.name?.trim();
      if (Number.isNaN(sectionId) || !name) {
        return NextResponse.json({ error: "Valid section and name are required" }, { status: 400 });
      }

      const layout = await getShopLayout();
      const section = layout.sections.find((item) => item.id === sectionId);
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      if (
        layout.sections.some(
          (item) => item.id !== sectionId && item.name.toLowerCase() === name.toLowerCase(),
        )
      ) {
        return NextResponse.json({ error: "Section already exists" }, { status: 409 });
      }

      await db.transaction(async (tx) => {
        await tx
          .update(shopSections)
          .set({ name })
          .where(eq(shopSections.id, sectionId));
        await tx
          .update(ingredients)
          .set({ category: name })
          .where(eq(ingredients.category, section.name));
      });
      await invalidate(CACHE_KEYS.shopLayout, CACHE_KEYS.ingredients);
      logAction({
        action: "shop_section.rename",
        outcome: "success",
        resource: "shop_section",
        resourceId: sectionId,
        summary: `Renamed shop section "${section.name}" to "${name}"`,
      });
      return NextResponse.json(await getShopLayout());
    },
    request,
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleRoute(
    `DELETE /api/shop-layout/${id}`,
    "shop_section.delete",
    async () => {
      const sectionId = Number.parseInt(id, 10);
      if (Number.isNaN(sectionId)) {
        return NextResponse.json({ error: "Invalid section id" }, { status: 400 });
      }

      const layout = await getShopLayout();
      const section = layout.sections.find((item) => item.id === sectionId);
      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }
      if (layout.ingredients.some((item) => item.category === section.name)) {
        return NextResponse.json(
          { error: "Move all ingredients out of this section first" },
          { status: 409 },
        );
      }

      await db.delete(shopSections).where(eq(shopSections.id, sectionId));
      await invalidate(CACHE_KEYS.shopLayout);
      logAction({
        action: "shop_section.delete",
        outcome: "success",
        resource: "shop_section",
        resourceId: sectionId,
        summary: `Deleted shop section "${section.name}"`,
      });
      return NextResponse.json(await getShopLayout());
    },
    request,
  );
}
