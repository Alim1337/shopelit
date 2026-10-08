import { NextRequest } from "next/server";
import { db } from "@/db";
import { blogPosts, blogCategories, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { successResponse, notFoundResponse, errorResponse } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const result = await db
      .select({
        post: blogPosts,
        author: { id: users.id, name: users.name, avatar: users.avatar },
        category: { id: blogCategories.id, name: blogCategories.name, slug: blogCategories.slug },
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")))
      .limit(1);

    if (!result[0]) return notFoundResponse("Blog post");

    await db
      .update(blogPosts)
      .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
      .where(eq(blogPosts.id, result[0].post.id));

    return successResponse({ ...result[0].post, author: result[0].author, category: result[0].category });
  } catch (error) {
    console.error("[BLOG POST GET ERROR]", error);
    return errorResponse("Failed to fetch blog post.", 500);
  }
}
