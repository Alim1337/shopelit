import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { shippingMethods, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";

const updateCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  price: z.number().min(0).optional(),
  estimatedDays: z.number().int().min(0).optional(),
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
    const existing = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Delivery company");

    const body = await req.json();
    const result = updateCompanySchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description || null;
    if (data.price !== undefined) updates.price = data.price.toFixed(2);
    if (data.estimatedDays !== undefined) updates.estimatedDays = data.estimatedDays;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    await db.update(shippingMethods).set(updates).where(eq(shippingMethods.id, id));

    const updated = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
    return successResponse(updated[0], "Delivery company updated successfully");
  } catch (error) {
    console.error("[ADMIN DELIVERY COMPANY PATCH ERROR]", error);
    return errorResponse("Failed to update delivery company.", 500);
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
    const existing = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Delivery company");

    const usedByOrders = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.shippingMethodId, id))
      .limit(1);

    if (usedByOrders.length > 0) {
      // Deactivate instead of delete so historical orders keep a valid reference.
      await db.update(shippingMethods).set({ isActive: false }).where(eq(shippingMethods.id, id));
      return successResponse({ deactivated: true }, "This company has past orders, so it was deactivated instead of deleted.");
    }

    await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
    return successResponse({ success: true }, "Delivery company deleted successfully");
  } catch (error) {
    console.error("[ADMIN DELIVERY COMPANY DELETE ERROR]", error);
    return errorResponse("Failed to delete delivery company.", 500);
  }
}
