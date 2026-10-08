import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, categories, brands } from "@/db/schema";
import { eq } from "drizzle-orm";
import ProductDetailClient from "./product-detail-client";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const result = await db
      .select({
        name: products.name,
        description: products.description,
        thumbnail: products.thumbnail,
        metaTitle: products.metaTitle,
        metaDescription: products.metaDescription,
      })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!result[0]) return { title: "Product Not Found" };

    const product = result[0];
    return {
      title: product.metaTitle || product.name,
      description:
        product.metaDescription ||
        product.description ||
        `Shop ${product.name} at ShopElite`,
      openGraph: {
        title: product.name,
        description: product.description || "",
        images: product.thumbnail ? [product.thumbnail] : [],
      },
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  try {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (!result[0] || result[0].status !== "active") {
      notFound();
    }

    // Fetch related products
    const related = result[0].categoryId
      ? await db
          .select()
          .from(products)
          .where(eq(products.categoryId, result[0].categoryId))
          .limit(4)
      : [];

    return (
      <ProductDetailClient
        productSlug={slug}
        initialProduct={result[0] as unknown as Product}
        relatedProducts={related.filter((p) => p.id !== result[0].id) as unknown as Product[]}
      />
    );
  } catch {
    notFound();
  }
}
