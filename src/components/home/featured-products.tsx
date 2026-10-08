"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@/types";

interface FeaturedProductsProps {
  featured: Product[];
  newArrivals: Product[];
  bestSellers: Product[];
  onSale: Product[];
  isLoading?: boolean;
}

const TABS = [
  { key: "featured", label: "Featured", icon: "⭐" },
  { key: "newArrivals", label: "New Arrivals", icon: "🆕" },
  { key: "bestSellers", label: "Best Sellers", icon: "🏆" },
  { key: "onSale", label: "On Sale", icon: "🔥" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FeaturedProducts({
  featured,
  newArrivals,
  bestSellers,
  onSale,
  isLoading = false,
}: FeaturedProductsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("featured");

  const products: Record<TabKey, Product[]> = {
    featured,
    newArrivals,
    bestSellers,
    onSale,
  };

  const currentProducts = products[activeTab].slice(0, 8);
  const tabLinks: Record<TabKey, string> = {
    featured: "/products?isFeatured=true",
    newArrivals: "/products?isNewArrival=true",
    bestSellers: "/products?isBestSeller=true",
    onSale: "/products?isOnSale=true",
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 rounded-full bg-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                Curated For You
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Our Collection
            </h2>
          </div>
          <Link
            href={tabLinks[activeTab]}
            className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : currentProducts.length > 0 ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {currentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            No products in this category yet.
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-10">
          <Link
            href={tabLinks[activeTab]}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all"
          >
            Browse All Products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
