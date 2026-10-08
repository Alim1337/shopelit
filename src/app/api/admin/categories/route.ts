import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from "@/lib/api";
import { generateId, createSlug } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const list = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        parentId: categories.parentId,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(categories.sortOrder, categories.name);

    return successResponse(list);
  } catch (error) {
    console.error("[ADMIN CATEGORIES GET ERROR]", error);
    return errorResponse("Failed to fetch categories.", 500);
  }
}

const categorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const body = await req.json();
    const result = categorySchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const slug = createSlug(data.name);
    const id = generateId("cat");

    await db.insert(categories).values({
      id,
      name: data.name,
      slug,
      description: data.description || null,
      image: data.image || null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    const created = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return successResponse(created[0], "Category created successfully", 201);
  } catch (error) {
    console.error("[ADMIN CATEGORIES POST ERROR]", error);
    return errorResponse("Failed to create category.", 500);
  }
}
