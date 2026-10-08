"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface RecentlyViewedItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  rating: number;
  viewedAt: string;
}

interface RecentlyViewedStore {
  items: RecentlyViewedItem[];
  addItem: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
  clear: () => void;
}

const MAX_ITEMS = 12;

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.filter((i) => i.productId !== item.productId);
        const updated = [{ ...item, viewedAt: new Date().toISOString() }, ...existing].slice(0, MAX_ITEMS);
        set({ items: updated });
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: "recently-viewed-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
