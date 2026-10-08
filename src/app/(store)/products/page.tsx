import type { Metadata } from "next";
import { Suspense } from "react";
import ProductsClient from "./products-client";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse our complete collection of premium products. Filter by category, brand, price, and more.",
};

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}
