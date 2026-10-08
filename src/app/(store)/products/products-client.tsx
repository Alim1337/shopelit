"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import ProductGrid from "@/components/products/product-grid";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { formatPrice } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "bestseller", label: "Best Sellers" },
  { value: "name", label: "Name A-Z" },
];

interface FilterState {
  search: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  isOnSale: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  sortBy: string;
}

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get("q") || searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    inStock: searchParams.get("inStock") === "true",
    isOnSale: searchParams.get("isOnSale") === "true",
    isFeatured: searchParams.get("isFeatured") === "true",
    isNewArrival: searchParams.get("isNewArrival") === "true",
    isBestSeller: searchParams.get("isBestSeller") === "true",
    sortBy: searchParams.get("sortBy") || "newest",
  });

  const limit = 24;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      if (filters.inStock) params.set("inStock", "true");
      if (filters.isOnSale) params.set("isOnSale", "true");
      if (filters.isFeatured) params.set("isFeatured", "true");
      if (filters.isNewArrival) params.set("isNewArrival", "true");
      if (filters.isBestSeller) params.set("isBestSeller", "true");
      params.set("sortBy", filters.sortBy);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setProducts(data.data.data);
        setTotal(data.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      minPrice: "",
      maxPrice: "",
      inStock: false,
      isOnSale: false,
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      sortBy: "newest",
    });
    setPage(1);
  };

  const hasActiveFilters =
    filters.search ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.inStock ||
    filters.isOnSale ||
    filters.isFeatured ||
    filters.isNewArrival ||
    filters.isBestSeller;

  const totalPages = Math.ceil(total / limit);

  // Active filter badges
  const activeFilters: { label: string; key: keyof FilterState }[] = [];
  if (filters.inStock) activeFilters.push({ label: "In Stock", key: "inStock" });
  if (filters.isOnSale) activeFilters.push({ label: "On Sale", key: "isOnSale" });
  if (filters.isFeatured) activeFilters.push({ label: "Featured", key: "isFeatured" });
  if (filters.isNewArrival) activeFilters.push({ label: "New Arrivals", key: "isNewArrival" });
  if (filters.isBestSeller) activeFilters.push({ label: "Best Sellers", key: "isBestSeller" });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">All Products</h1>
          <p className="text-slate-300">
            {loading ? "Loading..." : `${total.toLocaleString()} products available`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Search products..."
                className="pl-9 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-52"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl border text-sm font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="h-5 w-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Active Filter Tags */}
            {activeFilters.map((af) => (
              <span
                key={af.key}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
              >
                {af.label}
                <button onClick={() => updateFilter(af.key, false)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">Sort by:</span>
            <Select
              value={filters.sortBy}
              onValueChange={(val) => updateFilter("sortBy", val)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Price Range */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter("minPrice", e.target.value)}
                  placeholder="0 DA"
                  min="0"
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter("maxPrice", e.target.value)}
                  placeholder="50000 DA"
                  min="0"
                  className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Boolean Filters */}
              {[
                { key: "inStock" as const, label: "In Stock Only" },
                { key: "isOnSale" as const, label: "On Sale" },
                { key: "isNewArrival" as const, label: "New Arrivals" },
                { key: "isBestSeller" as const, label: "Best Sellers" },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <div
                    className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      filters[key]
                        ? "bg-indigo-600 border-indigo-600"
                        : "border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
                    }`}
                    onClick={() => updateFilter(key, !filters[key])}
                  >
                    {filters[key] && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}

        {/* Product Grid */}
        <ProductGrid products={products} loading={loading} columns={4} />

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:border-indigo-300 transition-colors"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, page - 2) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-10 w-10 rounded-xl text-sm font-medium transition-all ${
                      page === pageNum
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                        : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:border-indigo-300 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
