import { NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
} from "@/lib/api";
import { generateId } from "@/lib/utils";
import {
  couponInputSchema,
  validateCouponRules,
  couponToDbValues,
  isUniqueViolation,
} from "@/lib/admin-coupons";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const list = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return successResponse(list);
  } catch (error) {
    console.error("[ADMIN COUPONS GET ERROR]", error);
    return errorResponse("Failed to fetch coupons.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const body = await req.json().catch(() => null);
    const result = couponInputSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const ruleError = validateCouponRules(result.data);
    if (ruleError) return errorResponse(ruleError, 400);

    const [duplicate] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.code, result.data.code))
      .limit(1);
    if (duplicate) return errorResponse("A coupon with this code already exists.", 409);

    const id = generateId("cpn");
    await db.insert(coupons).values({ id, ...couponToDbValues(result.data) });

    const [created] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
    return successResponse(created, "Coupon created successfully", 201);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return errorResponse("A coupon with this code already exists.", 409);
    }
    console.error("[ADMIN COUPONS POST ERROR]", error);
    return errorResponse("Failed to create coupon.", 500);
  }
}
