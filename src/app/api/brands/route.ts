import { NextRequest } from "next/server";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const brandList = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logo: brands.logo,
        website: brands.website,
        sortOrder: brands.sortOrder,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .where(eq(brands.isActive, true))
      .groupBy(brands.id)
      .orderBy(brands.sortOrder, brands.name);

    return successResponse(brandList);
  } catch (error) {
    console.error("[BRANDS GET ERROR]", error);
    return errorResponse("Failed to fetch brands.", 500);
  }
}
