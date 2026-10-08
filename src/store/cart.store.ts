"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ProductVariant } from "@/types";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  stock: number;
  color?: string | null;
  size?: string | null;
  sku: string;
}

export interface CartCoupon {
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  discount: number;
}

interface CartStore {
  items: CartItem[];
  coupon: CartCoupon | null;
  isOpen: boolean;

  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant | null
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  applyCoupon: (coupon: CartCoupon) => void;
  removeCoupon: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotal: () => number;
  isInCart: (productId: string, variantId?: string | null) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isOpen: false,

      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items;
        const itemId = variant
          ? `${product.id}-${variant.id}`
          : product.id;
        const existing = items.find((i) => i.id === itemId);

        const price = variant
          ? parseFloat(variant.price)
          : parseFloat(product.price);
        const stock = variant ? variant.stock : product.stock;

        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, stock);
          set({
            items: items.map((i) =>
              i.id === itemId ? { ...i, quantity: newQty } : i
            ),
          });
        } else {
          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            variantId: variant?.id ?? null,
            name: product.name,
            slug: product.slug,
            price,
            image: variant?.image ?? product.thumbnail ?? (product.images?.[0] ?? null),
            quantity: Math.min(quantity, stock),
            stock,
            color: variant?.color ?? null,
            size: variant?.size ?? null,
            sku: variant?.sku ?? product.sku,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set({
          items: get().items.map((i) => {
            if (i.id === itemId) {
              return { ...i, quantity: Math.min(quantity, i.stock) };
            }
            return i;
          }),
        });
      },

      clearCart: () => set({ items: [], coupon: null }),

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getDiscount: () => {
        const coupon = get().coupon;
        if (!coupon) return 0;
        return coupon.discount;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return Math.max(0, subtotal - discount);
      },

      isInCart: (productId, variantId) => {
        const itemId = variantId ? `${productId}-${variantId}` : productId;
        return get().items.some((i) => i.id === itemId);
      },
    }),
    {
      name: "shopelite-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
