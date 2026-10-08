import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { wishlists, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api";
import { generateId } from "@/lib/utils";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const wishlistItems = await db
      .select({
        id: wishlists.id,
        productId: wishlists.productId,
        createdAt: wishlists.createdAt,
        product: {
          id: products.id,
          name: products.name,
          slug: products.slug,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
          thumbnail: products.thumbnail,
          images: products.images,
          rating: products.rating,
          reviewCount: products.reviewCount,
          stock: products.stock,
          isOnSale: products.isOnSale,
        },
      })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, user.id));

    return successResponse(wishlistItems);
  } catch (error) {
    console.error("[WISHLIST GET ERROR]", error);
    return errorResponse("Failed to fetch wishlist.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { productId } = await req.json();
    if (!productId) return errorResponse("Product ID is required.", 400);

    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing[0]) {
      // Remove from wishlist
      await db
        .delete(wishlists)
        .where(and(eq(wishlists.userId, user.id), eq(wishlists.productId, productId)));
      return successResponse({ added: false }, "Removed from wishlist");
    } else {
      // Add to wishlist
      await db.insert(wishlists).values({
        id: generateId("wl"),
        userId: user.id,
        productId,
      });
      return successResponse({ added: true }, "Added to wishlist");
    }
  } catch (error) {
    console.error("[WISHLIST POST ERROR]", error);
    return errorResponse("Failed to update wishlist.", 500);
  }
}
