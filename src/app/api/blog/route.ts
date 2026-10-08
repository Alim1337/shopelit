import { NextRequest } from "next/server";
import { db } from "@/db";
import { blogPosts, blogCategories, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get("categorySlug");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const offset = (page - 1) * limit;

    const conditions = [eq(blogPosts.status, "published")];

    let categoryId: string | undefined;
    if (categorySlug) {
      const cat = await db.select().from(blogCategories).where(eq(blogCategories.slug, categorySlug)).limit(1);
      if (cat[0]) categoryId = cat[0].id;
    }
    if (categoryId) conditions.push(eq(blogPosts.categoryId, categoryId));

    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        image: blogPosts.image,
        tags: blogPosts.tags,
        readTime: blogPosts.readTime,
        viewCount: blogPosts.viewCount,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        author: { id: users.id, name: users.name },
        category: { id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(...conditions))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);

    return successResponse({ data: posts, page, limit });
  } catch (error) {
    console.error("[BLOG GET ERROR]", error);
    return errorResponse("Failed to fetch blog posts.", 500);
  }
}
