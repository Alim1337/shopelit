import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, categories, brands, productVariants, reviews, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, notFoundResponse, errorResponse } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const productResult = await db
      .select({
        product: products,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
        },
        brand: {
          id: brands.id,
          name: brands.name,
          slug: brands.slug,
          logo: brands.logo,
          description: brands.description,
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(eq(products.slug, slug))
      .limit(1);

    if (!productResult[0]) {
      return notFoundResponse("Product");
    }

    const { product, category, brand } = productResult[0];

    // Get variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)));

    // Get approved reviews with user info
    const productReviews = await db
      .select({
        review: reviews,
        user: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(and(eq(reviews.productId, product.id), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(20);

    const formattedReviews = productReviews.map(({ review, user: u }) => ({
      ...review,
      user: u,
    }));

    // Increment view count (fire and forget)
    db.update(products)
      .set({ viewCount: (product.viewCount ?? 0) + 1 })
      .where(eq(products.id, product.id))
      .catch(console.error);

    return successResponse({
      ...product,
      category,
      brand,
      variants,
      reviews: formattedReviews,
    });
  } catch (error) {
    console.error("[PRODUCT SLUG ERROR]", error);
    return errorResponse("Failed to fetch product.", 500);
  }
}
