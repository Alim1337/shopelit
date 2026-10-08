"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Eye, Star, Zap } from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice, calculateDiscount } from "@/lib/utils";
import { toast } from "sonner";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  variant?: "default" | "compact" | "horizontal";
  className?: string;
}

export default function ProductCard({
  product,
  variant = "default",
  className,
}: ProductCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const isInCart = useCartStore((s) => s.isInCart);
  const openCart = useCartStore((s) => s.openCart);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const hasMounted = useHasMounted();

  const inWishlist = hasMounted && isInWishlist(product.id);
  const inCart = hasMounted && isInCart(product.id);

  const price = parseFloat(product.price);
  const comparePrice = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const discount = comparePrice ? calculateDiscount(comparePrice, price) : 0;

  const images = product.images?.length
    ? product.images
    : product.thumbnail
    ? [product.thumbnail]
    : ["/images/product-placeholder.jpg"];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0 && !product.allowBackorder) {
      toast.error("This product is out of stock");
      return;
    }

    addItem(product, 1);
    openCart();
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: images[0],
    });

    toast.success(
      inWishlist ? "Removed from wishlist" : "Added to wishlist"
    );
  };

  if (variant === "horizontal") {
    return (
      <Link href={`/products/${product.slug}`} className={cn("group flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all dark:bg-slate-900 dark:border-slate-800", className)}>
        <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className="object-cover"
            sizes="96px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs text-slate-500">{product.rating} ({product.reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-bold text-slate-900 dark:text-slate-100">{formatPrice(price)}</span>
            {comparePrice && (
              <span className="text-sm text-slate-400 line-through">{formatPrice(comparePrice)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn("group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all dark:bg-slate-900 dark:border-slate-800", className)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div
          className="relative overflow-hidden bg-slate-50 dark:bg-slate-800"
          style={{ paddingBottom: "100%" }}
          onMouseEnter={() => images.length > 1 && setCurrentImage(1)}
          onMouseLeave={() => setCurrentImage(0)}
        >
          <Image
            src={images[currentImage] || images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-all duration-500 group-hover:scale-105",
              !isImageLoaded && "opacity-0"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setIsImageLoaded(true)}
            priority={false}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <Badge variant="sale">-{discount}%</Badge>
            )}
            {product.isNewArrival && (
              <Badge variant="new">New</Badge>
            )}
            {product.isBestSeller && (
              <Badge variant="bestseller">⭐ Best Seller</Badge>
            )}
            {product.isFeatured && !product.isNewArrival && (
              <Badge variant="featured">Featured</Badge>
            )}
          </div>

          {product.stock === 0 && !product.allowBackorder && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
              <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleWishlistToggle}
              className={cn(
                "p-2 rounded-xl shadow-lg transition-all",
                inWishlist
                  ? "bg-red-500 text-white"
                  : "bg-white text-slate-700 hover:bg-red-50 hover:text-red-500"
              )}
              aria-label="Add to wishlist"
            >
              <Heart
                className={cn("h-4 w-4", inWishlist && "fill-current")}
              />
            </motion.button>
            <div
              className="p-2 rounded-xl bg-white shadow-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4" />
            </div>
          </div>

          {/* Quick Add Button */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 && !product.allowBackorder}
              className={cn(
                "w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                inCart
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-600 dark:hover:text-white"
              )}
            >
              {product.isOnSale && !inCart && <Zap className="h-4 w-4" />}
              <ShoppingCart className="h-4 w-4" />
              {inCart ? "In Cart" : "Add to Cart"}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Brand */}
          {(product as Product & { brand?: { name: string } }).brand && (
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              {(product as Product & { brand?: { name: string } }).brand?.name}
            </p>
          )}

          {/* Name */}
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-3.5 w-3.5",
                      star <= Math.round(parseFloat(product.rating))
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200 fill-slate-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">({product.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">
              {formatPrice(price)}
            </span>
            {comparePrice && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
