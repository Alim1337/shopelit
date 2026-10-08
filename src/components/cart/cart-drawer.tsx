"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Tag } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    getDiscount,
    getTotal,
    coupon,
    removeCoupon,
  } = useCartStore();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();
  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">Shopping Cart</h2>
                  <p className="text-xs text-slate-500">{items.length} {items.length === 1 ? "item" : "items"}</p>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            {remainingForFreeShipping > 0 && (
              <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-950">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-2">
                  Add <strong>{formatPrice(remainingForFreeShipping)}</strong> more for free shipping!
                </p>
                <div className="h-1.5 bg-indigo-100 dark:bg-indigo-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                    className="h-full bg-indigo-600 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <AnimatePresence>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center py-16"
                  >
                    <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <ShoppingCart className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Your cart is empty</h3>
                    <p className="text-sm text-slate-500 mb-6">Add some products to get started</p>
                    <button
                      onClick={closeCart}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Continue Shopping <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4"
                    >
                      {/* Image */}
                      <Link href={`/products/${item.slug}`} onClick={closeCart}>
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          )}
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${item.slug}`} onClick={closeCart}>
                          <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-indigo-600 transition-colors">
                            {item.name}
                          </h4>
                        </Link>
                        {(item.color || item.size) && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {[item.color, item.size].filter(Boolean).join(" / ")}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity */}
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                            <span className="px-3 text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                              <Plus className="h-3.5 w-3.5 text-slate-600" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                {/* Coupon */}
                {coupon && (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">{coupon.code}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-700 dark:text-green-300 font-semibold">-{formatPrice(coupon.discount)}</span>
                      <button onClick={removeCoupon} className="text-green-600 hover:text-green-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-600">{subtotal >= freeShippingThreshold ? "Free" : "Calculated at checkout"}</span>
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/25"
                  >
                    Checkout <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="flex items-center justify-center w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
