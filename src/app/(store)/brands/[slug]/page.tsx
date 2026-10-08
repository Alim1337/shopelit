import { notFound } from "next/navigation";
import Image from "next/image";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import CategoryProductsClient from "../../categories/[slug]/category-products-client";

async function getBrand(slug: string) {
  const result = await db
    .select()
    .from(brands)
    .where(and(eq(brands.slug, slug), eq(brands.isActive, true)))
    .limit(1);
  return result[0] ?? null;
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrand(slug);

  if (!brand) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
          {brand.logo ? (
            <Image src={brand.logo} alt={brand.name} fill className="object-contain p-2" sizes="64px" />
          ) : (
            <span className="text-2xl font-bold text-indigo-600">{brand.name[0]}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{brand.name}</h1>
          {brand.description && <p className="text-slate-500 mt-1 max-w-2xl">{brand.description}</p>}
        </div>
      </div>

      <CategoryProductsClient brandSlug={brand.slug} />
    </div>
  );
}
