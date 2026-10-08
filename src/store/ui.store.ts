"use client";

import { create } from "zustand";

interface UIStore {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  searchQuery: string;
  recentSearches: string[];
  currency: string;
  locale: string;

  // Actions
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleSearch: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setCurrency: (currency: string) => void;
  setLocale: (locale: string) => void;
}

export const useUIStore = create<UIStore>()((set, get) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  searchQuery: "",
  recentSearches:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("recentSearches") || "[]")
      : [],
  currency: "USD",
  locale: "en-US",

  toggleMobileMenu: () =>
    set({ isMobileMenuOpen: !get().isMobileMenuOpen }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  toggleSearch: () => set({ isSearchOpen: !get().isSearchOpen }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false, searchQuery: "" }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addRecentSearch: (query) => {
    const searches = get().recentSearches.filter((s) => s !== query);
    const updated = [query, ...searches].slice(0, 10);
    set({ recentSearches: updated });
    if (typeof window !== "undefined") {
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    }
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem("recentSearches");
    }
  },

  setCurrency: (currency) => set({ currency }),
  setLocale: (locale) => set({ locale }),
}));
