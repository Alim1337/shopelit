import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";
import { createSlug } from "@/lib/utils";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional().or(z.literal("")),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const existing = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Category");

    const body = await req.json();
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) {
      updates.name = data.name;
      updates.slug = createSlug(data.name);
    }
    if (data.description !== undefined) updates.description = data.description || null;
    if (data.image !== undefined) updates.image = data.image || null;
    if (data.parentId !== undefined) updates.parentId = data.parentId || null;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    await db.update(categories).set(updates).where(eq(categories.id, id));

    const updated = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return successResponse(updated[0], "Category updated successfully");
  } catch (error) {
    console.error("[ADMIN CATEGORY PATCH ERROR]", error);
    return errorResponse("Failed to update category.", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const existing = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Category");

    const productsInCategory = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.categoryId, id))
      .limit(1);

    if (productsInCategory.length > 0) {
      return errorResponse(
        "This category still has products assigned to it. Move or delete those products first.",
        409
      );
    }

    await db.delete(categories).where(eq(categories.id, id));
    return successResponse({ success: true }, "Category deleted successfully");
  } catch (error) {
    console.error("[ADMIN CATEGORY DELETE ERROR]", error);
    return errorResponse("Failed to delete category.", 500);
  }
}
