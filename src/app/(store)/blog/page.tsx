"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  image: string | null;
  readTime: number | null;
  publishedAt: string | null;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/blog")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setPosts(data.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Blog</h1>
        <p className="text-slate-500 mt-1">Stories, guides, and updates from the ShopElite team.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-500">No blog posts published yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                {post.image && (
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 text-xs font-semibold bg-white/90 dark:bg-slate-900/90 text-indigo-600 px-2.5 py-1 rounded-full">
                    {post.category.name}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt || post.createdAt)}
                  </span>
                  {post.readTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {post.readTime} min read
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
