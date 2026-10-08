import { NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { coupons, couponUsages, orders } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";
import {
  couponInputSchema,
  validateCouponRules,
  couponToDbValues,
  isUniqueViolation,
  type CouponInput,
} from "@/lib/admin-coupons";

// Any subset of the fields can be sent (e.g. just { isActive: false })
const updateSchema = couponInputSchema.partial();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const [existing] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!existing) return notFoundResponse("Coupon");

    const body = await req.json().catch(() => null);
    const result = updateSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    // Merge the changes onto the stored coupon, then validate the whole thing
    // so cross-field rules (type vs value, start vs expiry) always hold.
    const current: CouponInput = {
      code: existing.code,
      type: existing.type,
      value: Number(existing.value),
      minimumAmount: existing.minimumAmount != null ? Number(existing.minimumAmount) : null,
      maximumDiscount: existing.maximumDiscount != null ? Number(existing.maximumDiscount) : null,
      usageLimit: existing.usageLimit,
      usageLimitPerUser: existing.usageLimitPerUser,
      startsAt: existing.startsAt ? existing.startsAt.toISOString() : null,
      expiresAt: existing.expiresAt ? existing.expiresAt.toISOString() : null,
      description: existing.description,
      isActive: existing.isActive,
    };
    const merged: CouponInput = { ...current, ...result.data };

    const ruleError = validateCouponRules(merged);
    if (ruleError) return errorResponse(ruleError, 400);

    if (merged.code !== existing.code) {
      const [duplicate] = await db
        .select({ id: coupons.id })
        .from(coupons)
        .where(and(eq(coupons.code, merged.code), ne(coupons.id, id)))
        .limit(1);
      if (duplicate) return errorResponse("A coupon with this code already exists.", 409);
    }

    await db
      .update(coupons)
      .set({ ...couponToDbValues(merged), updatedAt: new Date() })
      .where(eq(coupons.id, id));

    const [updated] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return successResponse(updated, "Coupon updated successfully");
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorResponse("A coupon with this code already exists.", 409);
    }
    console.error("[ADMIN COUPON PATCH ERROR]", error);
    return errorResponse("Failed to update coupon.", 500);
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
    const [existing] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    if (!existing) return notFoundResponse("Coupon");

    const [usedInOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.couponId, id))
      .limit(1);
    const [hasUsage] = await db
      .select({ id: couponUsages.id })
      .from(couponUsages)
      .where(eq(couponUsages.couponId, id))
      .limit(1);

    if (existing.usedCount > 0 || usedInOrder || hasUsage) {
      // Keep it so past orders keep a valid reference; just switch it off
      await db
        .update(coupons)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(coupons.id, id));
      return successResponse(
        { deactivated: true },
        "This coupon has been used in orders, so it was deactivated instead of deleted."
      );
    }

    await db.delete(coupons).where(eq(coupons.id, id));
    return successResponse({ deleted: true }, "Coupon deleted successfully");
  } catch (error) {
    console.error("[ADMIN COUPON DELETE ERROR]", error);
    return errorResponse("Failed to delete coupon.", 500);
  }
}
