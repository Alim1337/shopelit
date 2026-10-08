"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { useWishlistStore } from "@/store/wishlist.store";
import { useCartStore } from "@/store/cart.store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();
  const addToCart = useCartStore((s) => s.addItem);
  const hasMounted = useHasMounted();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCart = async (slug: string, productId: string) => {
    setAddingId(productId);
    try {
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();
      if (!data.success) {
        toast.error("Failed to add to cart");
        return;
      }
      addToCart(data.data, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setAddingId(null);
    }
  };

  if (!hasMounted) {
    return <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 min-h-[50vh]" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <Heart className="h-9 w-9 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Your wishlist is empty</h1>
        <p className="text-slate-500 mb-8">Save items you love to find them here later.</p>
        <Link href="/products">
          <Button size="lg">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8">
        Wishlist <span className="text-slate-400 font-normal text-xl">({items.length})</span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800"
          >
            <Link href={`/products/${item.slug}`} className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image src={item.image || "/images/product-placeholder.jpg"} alt={item.name} fill className="object-cover" sizes="80px" />
            </Link>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/products/${item.slug}`} className="font-medium text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors line-clamp-2">
                  {item.name}
                </Link>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                  aria-label="Remove from wishlist"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.price)}</span>
                <button
                  onClick={() => handleAddToCart(item.slug, item.productId)}
                  disabled={addingId === item.productId}
                  className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
