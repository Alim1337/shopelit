import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { reviews, products, users } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  getPagination,
  buildPaginatedResponse,
} from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPagination(searchParams);
    const status = searchParams.get("status");

    const conditions = status ? [eq(reviews.status, status as "pending" | "approved" | "rejected")] : [];

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(reviews)
      .where(conditions.length ? and(...conditions) : undefined);

    const list = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        content: reviews.content,
        images: reviews.images,
        status: reviews.status,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        adminReply: reviews.adminReply,
        createdAt: reviews.createdAt,
        product: { id: products.id, name: products.name, slug: products.slug, thumbnail: products.thumbnail },
        user: { id: users.id, name: users.name, email: users.email },
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return successResponse(buildPaginatedResponse(list, count, page, limit));
  } catch (error) {
    console.error("[ADMIN REVIEWS GET ERROR]", error);
    return errorResponse("Failed to fetch reviews.", 500);
  }
}
