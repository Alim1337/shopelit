import { NextRequest } from "next/server";
import { db } from "@/db";
import { products, categories, brands, reviews } from "@/db/schema";
import { eq, and, gte, lte, ilike, or, desc, asc, sql, inArray, isNull } from "drizzle-orm";
import { successResponse, errorResponse, getPagination, buildPaginatedResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPagination(searchParams);

    // Filters
    const search = searchParams.get("search") || searchParams.get("q");
    const categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("categorySlug");
    const brandId = searchParams.get("brandId");
    const brandSlug = searchParams.get("brandSlug");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const isOnSale = searchParams.get("isOnSale");
    const isFeatured = searchParams.get("isFeatured");
    const isNewArrival = searchParams.get("isNewArrival");
    const isBestSeller = searchParams.get("isBestSeller");
    const status = searchParams.get("status") || "active";
    const sortBy = searchParams.get("sortBy") || "newest";

    // Build WHERE conditions
    const conditions = [];

    // Status filter
    if (status === "active") {
      conditions.push(eq(products.status, "active"));
    } else if (status !== "all") {
      conditions.push(eq(products.status, status as "draft" | "active" | "inactive" | "archived"));
    }

    // Search
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`),
          ilike(products.sku, `%${search}%`)
        )
      );
    }

    // Category filter
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    } else if (categorySlug) {
      const cat = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);
      if (cat[0]) {
        conditions.push(eq(products.categoryId, cat[0].id));
      }
    }

    // Brand filter
    if (brandId) {
      conditions.push(eq(products.brandId, brandId));
    } else if (brandSlug) {
      const brand = await db
        .select({ id: brands.id })
        .from(brands)
        .where(eq(brands.slug, brandSlug))
        .limit(1);
      if (brand[0]) {
        conditions.push(eq(products.brandId, brand[0].id));
      }
    }

    // Price filters
    if (minPrice) {
      conditions.push(gte(products.price, minPrice));
    }
    if (maxPrice) {
      conditions.push(lte(products.price, maxPrice));
    }

    // Boolean filters
    if (inStock === "true") {
      conditions.push(gte(products.stock, 1));
    }
    if (isOnSale === "true") {
      conditions.push(
        eq(products.isOnSale, true),
        or(isNull(products.saleStartDate), lte(products.saleStartDate, new Date())),
        or(isNull(products.saleEndDate), gte(products.saleEndDate, new Date()))
      );
    }
    if (isFeatured === "true") {
      conditions.push(eq(products.isFeatured, true));
    }
    if (isNewArrival === "true") {
      conditions.push(eq(products.isNewArrival, true));
    }
    if (isBestSeller === "true") {
      conditions.push(eq(products.isBestSeller, true));
    }

    // Sort
    let orderBy;
    switch (sortBy) {
      case "price_asc":
        orderBy = asc(products.price);
        break;
      case "price_desc":
        orderBy = desc(products.price);
        break;
      case "rating":
        orderBy = desc(products.rating);
        break;
      case "bestseller":
        orderBy = desc(products.soldCount);
        break;
      case "name":
        orderBy = asc(products.name);
        break;
      default:
        orderBy = desc(products.createdAt);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    // Get products with joins
    const productList = await db
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
        },
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const formattedProducts = productList.map(({ product, category, brand }) => ({
      ...product,
      category,
      brand,
    }));

    return successResponse(
      buildPaginatedResponse(formattedProducts, count, page, limit)
    );
  } catch (error) {
    console.error("[PRODUCTS GET ERROR]", error);
    return errorResponse("Failed to fetch products.", 500);
  }
}
