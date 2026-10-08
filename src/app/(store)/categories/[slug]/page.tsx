import { notFound } from "next/navigation";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import CategoryProductsClient from "./category-products-client";

async function getCategory(slug: string) {
  const result = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);
  return result[0] ?? null;
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{category.name}</h1>
        {category.description && <p className="text-slate-500 mt-1 max-w-2xl">{category.description}</p>}
      </div>

      <CategoryProductsClient categorySlug={category.slug} />
    </div>
  );
}
