import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, categories, brands } from "@/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { successResponse, errorResponse, rateLimit, getIpAddress } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { success } = rateLimit(`suggest:${getIpAddress(req)}`, 60, 60 * 1000);
    if (!success) {
      return errorResponse("Too many requests. Please slow down.", 429);
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return successResponse({ products: [], categories: [], brands: [] });
    }

    const pattern = `%${q}%`;

    const [matchedProducts, matchedCategories, matchedBrands] = await Promise.all([
      db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          thumbnail: products.thumbnail,
          price: products.price,
          compareAtPrice: products.compareAtPrice,
        })
        .from(products)
        .where(
          and(
            eq(products.status, "active"),
            or(ilike(products.name, pattern), ilike(products.sku, pattern), ilike(products.description, pattern))
          )
        )
        .orderBy(desc(products.soldCount))
        .limit(6),

      db
        .select({ id: categories.id, name: categories.name, slug: categories.slug })
        .from(categories)
        .where(and(eq(categories.isActive, true), ilike(categories.name, pattern)))
        .limit(3),

      db
        .select({ id: brands.id, name: brands.name, slug: brands.slug })
        .from(brands)
        .where(and(eq(brands.isActive, true), ilike(brands.name, pattern)))
        .limit(3),
    ]);

    return successResponse({
      products: matchedProducts,
      categories: matchedCategories,
      brands: matchedBrands,
    });
  } catch (error) {
    console.error("[SEARCH SUGGESTIONS ERROR]", error);
    return successResponse({ products: [], categories: [], brands: [] });
  }
}
