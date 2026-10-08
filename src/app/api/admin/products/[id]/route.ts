import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";
import { productSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Product");

    const body = await req.json();
    const result = productSchema.partial().safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) updates.name = data.name;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.description !== undefined) updates.description = data.description;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;
    if (data.brandId !== undefined) updates.brandId = data.brandId;
    if (data.status !== undefined) updates.status = data.status;
    if (data.price !== undefined) updates.price = data.price.toFixed(2);
    if (data.compareAtPrice !== undefined) updates.compareAtPrice = data.compareAtPrice.toFixed(2);
    if (data.stock !== undefined) updates.stock = data.stock;
    if (data.images !== undefined) updates.images = data.images;
    if (data.thumbnail !== undefined) updates.thumbnail = data.thumbnail;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.isFeatured !== undefined) updates.isFeatured = data.isFeatured;
    if (data.isNewArrival !== undefined) updates.isNewArrival = data.isNewArrival;
    if (data.isBestSeller !== undefined) updates.isBestSeller = data.isBestSeller;
    if (data.isOnSale !== undefined) updates.isOnSale = data.isOnSale;
    if (data.saleStartDate !== undefined) updates.saleStartDate = data.saleStartDate ? new Date(data.saleStartDate) : null;
    if (data.saleEndDate !== undefined) updates.saleEndDate = data.saleEndDate ? new Date(data.saleEndDate) : null;

    await db.update(products).set(updates).where(eq(products.id, id));

    const updated = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return successResponse(updated[0], "Product updated successfully");
  } catch (error) {
    console.error("[ADMIN PRODUCT PATCH ERROR]", error);
    return errorResponse("Failed to update product.", 500);
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
    const existing = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Product");

    await db.delete(products).where(eq(products.id, id));

    return successResponse({ success: true }, "Product deleted successfully");
  } catch (error) {
    console.error("[ADMIN PRODUCT DELETE ERROR]", error);
    return errorResponse("Failed to delete product.", 500);
  }
}
