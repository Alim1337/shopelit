import { NextRequest } from "next/server";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const categoryList = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        parentId: categories.parentId,
        level: categories.level,
        sortOrder: categories.sortOrder,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .where(eq(categories.isActive, true))
      .groupBy(categories.id)
      .orderBy(categories.sortOrder, categories.name);

    // Build tree structure
    const categoryMap = new Map<string, typeof categoryList[0] & { children: unknown[] }>();
    categoryList.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const roots: Array<typeof categoryList[0] & { children: unknown[] }> = [];
    categoryMap.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(cat);
        }
      } else {
        roots.push(cat);
      }
    });

    return successResponse(roots);
  } catch (error) {
    console.error("[CATEGORIES GET ERROR]", error);
    return errorResponse("Failed to fetch categories.", 500);
  }
}
