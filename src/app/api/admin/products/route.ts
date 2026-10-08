import { NextRequest } from "next/server";
import { productSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  getPagination,
  buildPaginatedResponse,
} from "@/lib/api";
import { generateId, createSlug } from "@/lib/utils";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPagination(searchParams);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);

    const productList = await db
      .select()
      .from(products)
      .orderBy(sql`${products.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return successResponse(buildPaginatedResponse(productList, count, page, limit));
  } catch (error) {
    console.error("[ADMIN PRODUCTS GET ERROR]", error);
    return errorResponse("Failed to fetch products.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const body = await req.json();
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const data = result.data;
    const slug = data.slug || createSlug(data.name);

    const productId = generateId("prod");
    await db.insert(products).values({
      id: productId,
      name: data.name,
      slug,
      sku: data.sku,
      description: data.description ?? null,
      richDescription: data.richDescription ?? null,
      categoryId: data.categoryId ?? null,
      brandId: data.brandId ?? null,
      status: data.status,
      price: data.price.toFixed(2),
      compareAtPrice: data.compareAtPrice?.toFixed(2) ?? null,
      costPrice: data.costPrice?.toFixed(2) ?? null,
      discountPercentage: data.discountPercentage?.toFixed(2) ?? null,
      taxRate: data.taxRate?.toFixed(2) ?? "0",
      stock: data.stock,
      lowStockThreshold: data.lowStockThreshold ?? 10,
      allowBackorder: data.allowBackorder,
      weight: data.weight?.toFixed(2) ?? null,
      weightUnit: data.weightUnit ?? "kg",
      images: data.images,
      thumbnail: data.thumbnail ?? null,
      videoUrl: data.videoUrl || null,
      tags: data.tags,
      colors: data.colors,
      sizes: data.sizes,
      isFeatured: data.isFeatured,
      isNewArrival: data.isNewArrival,
      isBestSeller: data.isBestSeller,
      isOnSale: data.isOnSale,
      saleStartDate: data.saleStartDate ? new Date(data.saleStartDate) : null,
      saleEndDate: data.saleEndDate ? new Date(data.saleEndDate) : null,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      publishedAt: data.status === "active" ? new Date() : null,
    });

    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    return successResponse(product[0], "Product created successfully", 201);
  } catch (error) {
    console.error("[ADMIN PRODUCTS POST ERROR]", error);
    return errorResponse("Failed to create product.", 500);
  }
}
