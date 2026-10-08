import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { blogPosts, blogCategories, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
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

  if (!result[0]) return null;

  await db
    .update(blogPosts)
    .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
    .where(eq(blogPosts.id, result[0].post.id));

  return result[0];
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data) notFound();
  const { post, author, category } = data;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to blog
      </Link>

      {category && (
        <Link
          href={`/blog?category=${category.slug}`}
          className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full mb-4"
        >
          {category.name}
        </Link>
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{post.title}</h1>

      <div className="flex items-center gap-4 mt-4 text-sm text-slate-500">
        {author?.name && <span>By {author.name}</span>}
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt || post.createdAt)}
        </span>
        {post.readTime && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {post.readTime} min read
          </span>
        )}
      </div>

      {post.image && (
        <div className="relative aspect-video rounded-2xl overflow-hidden mt-8 bg-slate-100 dark:bg-slate-800">
          <Image src={post.image} alt={post.title} fill className="object-cover" sizes="768px" priority />
        </div>
      )}

      <div
        className="prose prose-slate dark:prose-invert max-w-none mt-8"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
