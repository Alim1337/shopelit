import { NextRequest } from "next/server";
import { db } from "@/db";
import { coupons, couponUsages } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse, rateLimit, getIpAddress } from "@/lib/api";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    // Stops people from guessing coupon codes
    const { success } = rateLimit(`coupon:${getIpAddress(req)}`, 15, 60 * 1000);
    if (!success) {
      return errorResponse("Too many attempts. Please wait a moment.", 429);
    }

    const { code, subtotal } = await req.json();
    if (!code || typeof code !== "string" || code.length > 50) {
      return errorResponse("Coupon code is required.", 400);
    }

    const user = await getCurrentUser();

    const couponResult = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase()))
      .limit(1);

    if (!couponResult[0]) {
      return errorResponse("Invalid coupon code.", 400);
    }

    const coupon = couponResult[0];
    const now = new Date();

    if (!coupon.isActive) {
      return errorResponse("This coupon is no longer active.", 400);
    }

    if (coupon.startsAt && coupon.startsAt > now) {
      return errorResponse("This coupon is not yet active.", 400);
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      return errorResponse("This coupon has expired.", 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse("This coupon has reached its usage limit.", 400);
    }

    if (coupon.minimumAmount && subtotal < parseFloat(coupon.minimumAmount)) {
      return errorResponse(
        `Minimum order amount of $${coupon.minimumAmount} required.`,
        400
      );
    }

    // Check per-user limit
    if (user && coupon.usageLimitPerUser) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(couponUsages)
        .where(
          and(
            eq(couponUsages.couponId, coupon.id),
            eq(couponUsages.userId, user.id)
          )
        );

      if (count >= coupon.usageLimitPerUser) {
        return errorResponse("You have already used this coupon.", 400);
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (subtotal * parseFloat(coupon.value)) / 100;
      if (coupon.maximumDiscount) {
        discount = Math.min(discount, parseFloat(coupon.maximumDiscount));
      }
    } else if (coupon.type === "fixed") {
      discount = Math.min(parseFloat(coupon.value), subtotal);
    }

    return successResponse({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: discount.toFixed(2),
      description: coupon.description,
    });
  } catch (error) {
    console.error("[COUPON VALIDATE ERROR]", error);
    return errorResponse("Failed to validate coupon.", 500);
  }
}
