"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, TrendingUp, Tag, BadgePercent } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface SuggestionProduct {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: string;
  compareAtPrice: string | null;
}

interface SuggestionTaxonomy {
  id: string;
  name: string;
  slug: string;
}

interface Suggestions {
  products: SuggestionProduct[];
  categories: SuggestionTaxonomy[];
  brands: SuggestionTaxonomy[];
}

const EMPTY: Suggestions = { products: [], categories: [], brands: [] };

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onSuggestionClick?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  inputClassName?: string;
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  onSuggestionClick,
  autoFocus,
  placeholder = "Search products, brands, categories...",
  inputClassName,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const flatResults = [
    ...suggestions.categories.map((c) => ({ type: "category" as const, item: c })),
    ...suggestions.brands.map((b) => ({ type: "brand" as const, item: b })),
    ...suggestions.products.map((p) => ({ type: "product" as const, item: p })),
  ];

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const query = value.trim();
    if (query.length < 2) {
      setSuggestions(EMPTY);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.data);
          setShowDropdown(true);
        }
      } catch {
        setSuggestions(EMPTY);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToResult = useCallback(
    (result: (typeof flatResults)[number]) => {
      setShowDropdown(false);
      onSuggestionClick?.();
      if (result.type === "product") {
        router.push(`/products/${result.item.slug}`);
      } else if (result.type === "category") {
        router.push(`/products?categorySlug=${result.item.slug}`);
      } else {
        router.push(`/products?brandSlug=${result.item.slug}`);
      }
    },
    [router, onSuggestionClick]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || flatResults.length === 0) {
      if (e.key === "Enter") onSubmit(value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        navigateToResult(flatResults[activeIndex]);
      } else {
        setShowDropdown(false);
        onSubmit(value);
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const hasResults = flatResults.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowDropdown(false);
          onSubmit(value);
        }}
        className="relative"
      >
        <input
          autoFocus={autoFocus}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => value.trim().length >= 2 && setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClassName}
        />
        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
          aria-label="Search"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
        </button>
      </form>

      {showDropdown && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[70vh] overflow-y-auto z-10">
          {!hasResults && !loading && (
            <div className="px-5 py-6 text-center text-sm text-slate-500">
              No results for &ldquo;{value}&rdquo;
            </div>
          )}

          {suggestions.categories.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Categories
              </p>
              {suggestions.categories.map((c) => {
                const idx = flatResults.findIndex((r) => r.type === "category" && r.item.id === c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => navigateToResult({ type: "category", item: c })}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Tag className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {suggestions.brands.length > 0 && (
            <div className="py-2 border-t border-slate-100 dark:border-slate-800">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Brands
              </p>
              {suggestions.brands.map((b) => {
                const idx = flatResults.findIndex((r) => r.type === "brand" && r.item.id === b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => navigateToResult({ type: "brand", item: b })}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors ${
                      idx === activeIndex ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{b.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {suggestions.products.length > 0 && (
            <div className="py-2 border-t border-slate-100 dark:border-slate-800">
              <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Products
              </p>
              {suggestions.products.map((p) => {
                const idx = flatResults.findIndex((r) => r.type === "product" && r.item.id === p.id);
                const isOnSale = p.compareAtPrice && parseFloat(p.compareAtPrice) > parseFloat(p.price);
                return (
                  <button
                    key={p.id}
                    onClick={() => navigateToResult({ type: "product", item: p })}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === activeIndex ? "bg-indigo-50 dark:bg-indigo-950" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="relative h-11 w-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {p.thumbnail && (
                        <Image src={p.thumbnail} alt={p.name} fill className="object-cover" sizes="44px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {formatPrice(p.price)}
                        </span>
                        {isOnSale && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                            <BadgePercent className="h-3 w-3" />
                            Sale
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {hasResults && (
            <button
              onClick={() => {
                setShowDropdown(false);
                onSubmit(value);
              }}
              className="w-full px-4 py-3 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-t border-slate-100 dark:border-slate-800 transition-colors"
            >
              View all results for &ldquo;{value}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
