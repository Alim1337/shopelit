import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { reviews, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";

const moderateReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  adminReply: z.string().max(2000).optional(),
});

async function recalculateProductRating(productId: string) {
  const approved = await db
    .select({ rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

  const avgRating = approved.length > 0 ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length : 0;

  await db
    .update(products)
    .set({ rating: avgRating.toFixed(2), reviewCount: approved.length })
    .where(eq(products.id, productId));
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const existing = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Review");

    const body = await req.json();
    const result = moderateReviewSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (result.data.status) updates.status = result.data.status;
    if (result.data.adminReply !== undefined) {
      updates.adminReply = result.data.adminReply;
      updates.adminReplyAt = new Date();
    }

    await db.update(reviews).set(updates).where(eq(reviews.id, id));

    if (result.data.status) {
      await recalculateProductRating(existing[0].productId);
    }

    const updated = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    return successResponse(updated[0], "Review updated successfully");
  } catch (error) {
    console.error("[ADMIN REVIEW PATCH ERROR]", error);
    return errorResponse("Failed to update review.", 500);
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
    const existing = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Review");

    await db.delete(reviews).where(eq(reviews.id, id));
    await recalculateProductRating(existing[0].productId);

    return successResponse({ success: true }, "Review deleted successfully");
  } catch (error) {
    console.error("[ADMIN REVIEW DELETE ERROR]", error);
    return errorResponse("Failed to delete review.", 500);
  }
}
