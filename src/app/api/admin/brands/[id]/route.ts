import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, validationErrorResponse } from "@/lib/api";
import { createSlug } from "@/lib/utils";

const updateBrandSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const existing = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Brand");

    const body = await req.json();
    const result = updateBrandSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) { updates.name = data.name; updates.slug = createSlug(data.name); }
    if (data.description !== undefined) updates.description = data.description || null;
    if (data.logo !== undefined) updates.logo = data.logo || null;
    if (data.website !== undefined) updates.website = data.website || null;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    await db.update(brands).set(updates).where(eq(brands.id, id));
    const updated = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    return successResponse(updated[0], "Brand updated successfully");
  } catch (error) {
    console.error("[ADMIN BRAND PATCH ERROR]", error);
    return errorResponse("Failed to update brand.", 500);
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const existing = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Brand");

    const hasProducts = await db.select({ id: products.id }).from(products).where(eq(products.brandId, id)).limit(1);
    if (hasProducts.length > 0) return errorResponse("This brand still has products. Remove them first.", 409);

    await db.delete(brands).where(eq(brands.id, id));
    return successResponse({ success: true }, "Brand deleted");
  } catch (error) {
    console.error("[ADMIN BRAND DELETE ERROR]", error);
    return errorResponse("Failed to delete brand.", 500);
  }
}
