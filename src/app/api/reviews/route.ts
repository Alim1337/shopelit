import { NextRequest } from "next/server";
import { reviewSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { reviews, orderItems, orders, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
  rateLimit,
} from "@/lib/api";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { success } = rateLimit(`review:${user.id}`, 10, 10 * 60 * 1000);
    if (!success) {
      return errorResponse("Too many reviews submitted. Please try again later.", 429);
    }

    const body = await req.json();
    const { productId, ...reviewData } = body;

    if (!productId) {
      return errorResponse("Product ID is required.", 400);
    }

    const result = reviewSchema.safeParse(reviewData);
    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    // Check if already reviewed
    const existingReview = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, user.id)))
      .limit(1);

    if (existingReview[0]) {
      return errorResponse("You have already reviewed this product.", 409);
    }

    // Check if verified purchase
    const verifiedPurchase = await db
      .select({ orderId: orders.id })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, user.id),
          eq(orderItems.productId, productId),
          eq(orders.status, "delivered")
        )
      )
      .limit(1);

    const reviewId = generateId("rev");
    await db.insert(reviews).values({
      id: reviewId,
      productId,
      userId: user.id,
      orderId: verifiedPurchase[0]?.orderId ?? null,
      rating: result.data.rating,
      title: result.data.title ?? null,
      content: result.data.content,
      images: result.data.images,
      status: "pending",
      isVerifiedPurchase: !!verifiedPurchase[0],
      helpfulCount: 0,
    });

    // Update product rating
    const allReviews = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")));

    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await db
        .update(products)
        .set({
          rating: avgRating.toFixed(2),
          reviewCount: allReviews.length,
        })
        .where(eq(products.id, productId));
    }

    return successResponse(
      { reviewId },
      "Review submitted. It will appear after moderation.",
      201
    );
  } catch (error) {
    console.error("[REVIEW POST ERROR]", error);
    return errorResponse("Failed to submit review.", 500);
  }
}
