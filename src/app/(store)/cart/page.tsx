"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart.store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const router = useRouter();
  const { items, coupon, removeItem, updateQuantity, applyCoupon, removeCoupon, getSubtotal, getDiscount, getTotal } =
    useCartStore();
  const hasMounted = useHasMounted();

  const [couponCode, setCouponCode] = useState("");
  const [applying, setApplying] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Invalid coupon");
        return;
      }
      applyCoupon({
        code: data.data.code,
        type: data.data.type,
        value: parseFloat(data.data.value),
        discount: parseFloat(data.data.discount),
      });
      toast.success(`Coupon "${data.data.code}" applied!`);
      setCouponCode("");
    } catch {
      toast.error("Failed to validate coupon");
    } finally {
      setApplying(false);
    }
  };

  if (!hasMounted) {
    return <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 min-h-[50vh]" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <ShoppingBag className="h-9 w-9 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              <Link href={`/products/${item.slug}`} className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image src={item.image || "/images/product-placeholder.jpg"} alt={item.name} fill className="object-cover" sizes="96px" />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/products/${item.slug}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors line-clamp-2">
                      {item.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-1">
                      {[item.color, item.size].filter(Boolean).join(" · ") || item.sku}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Order Summary</h2>

            {coupon ? (
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-xl px-3 py-2 mb-4 text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Tag className="h-3.5 w-3.5" /> {coupon.code}
                </span>
                <button onClick={removeCoupon} aria-label="Remove coupon">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="text-sm"
                />
                <Button variant="secondary" onClick={handleApplyCoupon} loading={applying}>
                  Apply
                </Button>
              </div>
            )}

            <div className="space-y-2.5 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-xs">
                <span>Shipping & tax</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Total</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatPrice(total)}</span>
            </div>

            <Button className="w-full mt-6" size="lg" onClick={() => router.push("/checkout")}>
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
