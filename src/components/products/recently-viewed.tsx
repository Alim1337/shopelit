"use client";

import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewedStore } from "@/store/recently-viewed.store";
import { formatPrice } from "@/lib/utils";

export default function RecentlyViewed({ excludeProductId }: { excludeProductId?: string }) {
  const items = useRecentlyViewedStore((s) => s.items).filter((i) => i.productId !== excludeProductId);

  if (items.length === 0) return null;

  return (
    <section className="py-12 border-t border-slate-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Recently Viewed</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {items.slice(0, 8).map((item) => (
            <Link
              key={item.productId}
              href={`/products/${item.slug}`}
              className="group flex-shrink-0 w-40 sm:w-48"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={item.image || "/images/product-placeholder.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="192px"
                />
              </div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                {item.name}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{formatPrice(item.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
