"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Check,
  Minus,
  Plus,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useRecentlyViewedStore } from "@/store/recently-viewed.store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/product-card";
import RecentlyViewed from "@/components/products/recently-viewed";
import ReviewForm from "@/components/products/review-form";
import { formatPrice, calculateDiscount, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Product, ProductVariant, Review } from "@/types";

interface ProductDetailClientProps {
  productSlug: string;
  initialProduct: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  productSlug,
  initialProduct,
  relatedProducts,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<Product & { variants?: ProductVariant[]; reviews?: Review[] }>(initialProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");

  const { addItem, isInCart, openCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addItem);

  useEffect(() => {
    addRecentlyViewed({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
      image: product.thumbnail,
      rating: parseFloat(product.rating || "0"),
    });
    // Only record once per product mount, not on every product state update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const inWishlist = isInWishlist(product.id);
  const inCart = isInCart(product.id, selectedVariant?.id);

  const price = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.price);
  const comparePrice = selectedVariant?.compareAtPrice
    ? parseFloat(selectedVariant.compareAtPrice)
    : product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const discount = comparePrice ? calculateDiscount(comparePrice, price) : 0;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  const images = product.images?.length
    ? product.images
    : product.thumbnail
    ? [product.thumbnail]
    : ["/images/product-placeholder.jpg"];

  // Fetch full product data
  const [refreshKey, setRefreshKey] = useState(0);
  const refetchProduct = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productSlug}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
        }
      } catch {}
    }
    fetchProduct();
  }, [productSlug, refreshKey]);

  const handleAddToCart = () => {
    if (currentStock === 0 && !product.allowBackorder) {
      toast.error("This product is out of stock");
      return;
    }

    addItem(product, quantity, selectedVariant);
    openCart();
    toast.success(`${product.name} added to cart!`);
  };

  const handleWishlistToggle = () => {
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price,
      image: images[0],
    });
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const reviews = product.reviews || [];
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : parseFloat(product.rating);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Breadcrumb */}
      <div className="border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="hover:text-indigo-600 transition-colors">Products</Link>
            {product.category && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link
                  href={`/categories/${(product.category as { slug: string }).slug}`}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {(product.category as { name: string }).name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-900 dark:text-slate-100 font-medium line-clamp-1">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 group">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </motion.div>
              </AnimatePresence>

              {/* Zoom hint */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2">
                  <ZoomIn className="h-4 w-4 text-slate-700" />
                </div>
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && <Badge variant="sale">-{discount}%</Badge>}
                {product.isNewArrival && <Badge variant="new">New</Badge>}
                {product.isBestSeller && <Badge variant="bestseller">Best Seller</Badge>}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i
                        ? "border-indigo-600 shadow-lg"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    <div className="relative h-full w-full bg-slate-50">
                      <Image
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-6">
            {/* Brand */}
            {product.brand && (
              <Link
                href={`/brands/${(product.brand as { slug: string }).slug}`}
                className="text-sm font-semibold text-indigo-600 uppercase tracking-wider hover:text-indigo-700"
              >
                {(product.brand as { name: string }).name}
              </Link>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200 dark:text-slate-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-slate-500">
                ({product.reviewCount} reviews)
              </span>
              <span className="text-sm text-slate-400">|</span>
              <span className="text-sm text-green-600 font-medium">
                {product.soldCount} sold
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-slate-900 dark:text-slate-100">
                {formatPrice(price)}
              </span>
              {comparePrice && (
                <span className="text-xl text-slate-400 line-through">
                  {formatPrice(comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-lg font-bold text-green-600">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4">
                {/* Color variants */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Color: <span className="font-normal text-slate-500">{selectedVariant?.color || "Select"}</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            const v = product.variants?.find((va) => va.color === color);
                            setSelectedVariant(v || null);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                            selectedVariant?.color === color
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950"
                              : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size variants */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Size: <span className="font-normal text-slate-500">{selectedVariant?.size || "Select"}</span>
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            const v = product.variants?.find((va) => va.size === size);
                            setSelectedVariant(v || null);
                          }}
                          className={`h-10 min-w-[2.5rem] px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                            selectedVariant?.size === size
                              ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950"
                              : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {currentStock > 0 ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {currentStock <= 10 ? `Only ${currentStock} left in stock!` : "In Stock"}
                  </span>
                </>
              ) : product.allowBackorder ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium text-yellow-600">Available for Backorder</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-600">Out of Stock</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Minus className="h-4 w-4 text-slate-600" />
                </button>
                <span className="px-4 text-base font-semibold text-slate-900 dark:text-slate-100 min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(currentStock || 1, q + 1))}
                  disabled={quantity >= currentStock}
                  className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={currentStock === 0 && !product.allowBackorder}
                className={`flex-1 flex items-center justify-center gap-2.5 h-14 rounded-xl font-semibold text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  inCart
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/50"
                }`}
              >
                {inCart ? (
                  <>
                    <Check className="h-5 w-5" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Wishlist & Share */}
            <div className="flex gap-3">
              <button
                onClick={handleWishlistToggle}
                className={`flex items-center gap-2 flex-1 justify-center h-12 rounded-xl border-2 font-medium text-sm transition-all ${
                  inWishlist
                    ? "border-red-300 bg-red-50 text-red-600 dark:bg-red-950 dark:border-red-800"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-300 hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
                {inWishlist ? "Wishlisted" : "Add to Wishlist"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 font-medium text-sm transition-all"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Tabs: Description, Specs, Reviews */}
        <div className="mt-16">
          <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800 mb-8">
            {[
              { key: "description" as const, label: "Description" },
              { key: "specifications" as const, label: "Specifications" },
              { key: "reviews" as const, label: `Reviews (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                  activeTab === tab.key
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "description" && (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  {product.richDescription ? (
                    <div dangerouslySetInnerHTML={{ __html: product.richDescription }} />
                  ) : (
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {product.description || "No description available."}
                    </p>
                  )}
                </div>
              )}

              {activeTab === "specifications" && (
                <div>
                  {product.specifications ? (
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(product.specifications as Record<string, string>).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between items-center py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900"
                        >
                          <dt className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {key}
                          </dt>
                          <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-slate-500">No specifications available.</p>
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-6">
                  <ReviewForm productId={product.id} onReviewSubmitted={refetchProduct} />

                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Be the first to review this product
                      </p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white text-sm font-semibold">
                                {review.user?.name?.[0]?.toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                {review.user?.name || "Anonymous"}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3.5 w-3.5 ${
                                        star <= review.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                {review.isVerifiedPurchase && (
                                  <Badge variant="success" className="text-[10px]">
                                    <Check className="h-2.5 w-2.5" /> Verified
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        {review.title && (
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                            {review.title}
                          </h4>
                        )}
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          {review.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </div>

      <RecentlyViewed excludeProductId={product.id} />
    </div>
  );
}
