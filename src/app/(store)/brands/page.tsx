import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import { brands, products } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getBrands() {
  return db
    .select({
      id: brands.id,
      name: brands.name,
      slug: brands.slug,
      description: brands.description,
      logo: brands.logo,
      productCount: sql<number>`count(${products.id})::int`,
    })
    .from(brands)
    .leftJoin(products, eq(products.brandId, brands.id))
    .where(eq(brands.isActive, true))
    .groupBy(brands.id)
    .orderBy(brands.sortOrder, brands.name);
}

export default async function BrandsPage() {
  const list = await getBrands();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">All Brands</h1>
        <p className="text-slate-500 mt-1">Discover products from the brands you trust.</p>
      </div>

      {list.length === 0 ? (
        <p className="text-slate-500">No brands yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {list.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.slug}`}
              className="group flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 hover:shadow-md transition-all text-center"
            >
              <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                {brand.logo ? (
                  <Image src={brand.logo} alt={brand.name} fill className="object-contain p-2" sizes="64px" />
                ) : (
                  <span className="text-xl font-bold text-indigo-600">{brand.name[0]}</span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                  {brand.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{brand.productCount} products</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
