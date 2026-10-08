"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/types";

interface CategoriesSectionProps {
  categories: Category[];
}

const CATEGORY_COLORS = [
  "from-blue-500 to-indigo-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-teal-500",
  "from-yellow-500 to-orange-500",
  "from-pink-500 to-rose-500",
];

export default function CategoriesSection({ categories }: CategoriesSectionProps) {
  const topCategories = categories.slice(0, 6);

  if (!topCategories.length) return null;

  return (
    <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-8 rounded-full bg-purple-600" />
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">
                Browse By
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Popular Categories
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Find exactly what you're looking for
            </p>
          </div>
          <Link
            href="/categories"
            className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
          >
            All Categories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {topCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -4 }}
            >
              <Link
                href={`/categories/${category.slug}`}
                className="group flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:border-transparent transition-all"
              >
                {/* Category Icon/Image */}
                <div
                  className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length]
                  } flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">
                      {getCategoryEmoji(category.name)}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 transition-colors">
                    {category.name}
                  </h3>
                  {(category as Category & { productCount?: number }).productCount !== undefined && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(category as Category & { productCount?: number }).productCount} products
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("electron")) return "💻";
  if (lower.includes("phone") || lower.includes("mobile")) return "📱";
  if (lower.includes("fashion") || lower.includes("cloth")) return "👗";
  if (lower.includes("shoe") || lower.includes("footwear")) return "👟";
  if (lower.includes("home") || lower.includes("furniture")) return "🏠";
  if (lower.includes("sport") || lower.includes("fitness")) return "⚽";
  if (lower.includes("beauty") || lower.includes("skin")) return "💄";
  if (lower.includes("book")) return "📚";
  if (lower.includes("game") || lower.includes("toy")) return "🎮";
  if (lower.includes("jewel") || lower.includes("watch")) return "💍";
  if (lower.includes("food") || lower.includes("grocery")) return "🛒";
  if (lower.includes("car") || lower.includes("auto")) return "🚗";
  if (lower.includes("pet")) return "🐾";
  if (lower.includes("music")) return "🎵";
  if (lower.includes("art") || lower.includes("craft")) return "🎨";
  return "📦";
}
