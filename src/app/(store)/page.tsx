import type { Metadata } from "next";
import { db } from "@/db";
import { products, categories, brands } from "@/db/schema";
import { eq, desc, and, gte, or, isNull, lte } from "drizzle-orm";
import HeroSection from "@/components/home/hero-section";
import CategoriesSection from "@/components/home/categories-section";
import FeaturedProducts from "@/components/home/featured-products";
import FlashSaleSection from "@/components/home/flash-sale-section";
import NewsletterSection from "@/components/home/newsletter-section";
import type { Product, Category } from "@/types";

export const metadata: Metadata = {
  title: "ShopElite - Premium E-Commerce Platform",
  description:
    "Discover thousands of premium products from top brands. Enjoy fast shipping, easy returns, and exceptional customer service at ShopElite.",
};

// Revalidate every hour
export const revalidate = 3600;

async function getHomeData() {
  try {
    const [
      featuredProducts,
      newArrivals,
      bestSellers,
      saleProducts,
      topCategories,
    ] = await Promise.all([
      db
        .select()
        .from(products)
        .where(and(eq(products.status, "active"), eq(products.isFeatured, true)))
        .orderBy(desc(products.createdAt))
        .limit(8),

      db
        .select()
        .from(products)
        .where(
          and(eq(products.status, "active"), eq(products.isNewArrival, true))
        )
        .orderBy(desc(products.createdAt))
        .limit(8),

      db
        .select()
        .from(products)
        .where(
          and(eq(products.status, "active"), eq(products.isBestSeller, true))
        )
        .orderBy(desc(products.soldCount))
        .limit(8),

      db
        .select()
        .from(products)
        .where(
          and(
            eq(products.status, "active"),
            eq(products.isOnSale, true),
            or(isNull(products.saleStartDate), lte(products.saleStartDate, new Date())),
            or(isNull(products.saleEndDate), gte(products.saleEndDate, new Date()))
          )
        )
        .orderBy(desc(products.discountPercentage))
        .limit(4),

      db
        .select()
        .from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(categories.sortOrder)
        .limit(6),
    ]);

    return {
      featuredProducts: featuredProducts as unknown as Product[],
      newArrivals: newArrivals as unknown as Product[],
      bestSellers: bestSellers as unknown as Product[],
      saleProducts: saleProducts as unknown as Product[],
      categories: topCategories as unknown as Category[],
    };
  } catch {
    return {
      featuredProducts: [],
      newArrivals: [],
      bestSellers: [],
      saleProducts: [],
      categories: [],
    };
  }
}

export default async function HomePage() {
  const {
    featuredProducts,
    newArrivals,
    bestSellers,
    saleProducts,
    categories,
  } = await getHomeData();

  // Earliest end date among live sale products, if any have one set
  const saleEndTimes = saleProducts
    .map((p) => (p.saleEndDate ? new Date(p.saleEndDate) : null))
    .filter((d): d is Date => d !== null);
  const flashSaleEndTime = saleEndTimes.length
    ? new Date(Math.min(...saleEndTimes.map((d) => d.getTime())))
    : undefined;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "ShopElite",
            url: process.env.NEXT_PUBLIC_APP_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/search?q={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <HeroSection />
      <CategoriesSection categories={categories} />
      <FeaturedProducts
        featured={featuredProducts}
        newArrivals={newArrivals}
        bestSellers={bestSellers}
        onSale={saleProducts}
      />
      {saleProducts.length > 0 && <FlashSaleSection products={saleProducts} endTime={flashSaleEndTime} />}
      <NewsletterSection />
    </>
  );
}
