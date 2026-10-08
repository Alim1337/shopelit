import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
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
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        description: brands.description,
        logo: brands.logo,
        website: brands.website,
        sortOrder: brands.sortOrder,
        isActive: brands.isActive,
        productCount: sql<number>`count(${products.id})::int`,
      })
      .from(brands)
      .leftJoin(products, eq(products.brandId, brands.id))
      .groupBy(brands.id)
      .orderBy(brands.sortOrder, brands.name);

    return successResponse(list);
  } catch (error) {
    console.error("[ADMIN BRANDS GET ERROR]", error);
    return errorResponse("Failed to fetch brands.", 500);
  }
}

const brandSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const body = await req.json();
    const result = brandSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const slug = createSlug(data.name);
    const id = generateId("brd");

    await db.insert(brands).values({
      id,
      name: data.name,
      slug,
      description: data.description || null,
      logo: data.logo || null,
      website: data.website || null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    const created = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
    return successResponse(created[0], "Brand created successfully", 201);
  } catch (error) {
    console.error("[ADMIN BRANDS POST ERROR]", error);
    return errorResponse("Failed to create brand.", 500);
  }
}
