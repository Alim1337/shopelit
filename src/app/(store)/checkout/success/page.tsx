"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setIsLoggedIn(!!data.success))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="mx-auto h-20 w-20 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Order placed!</h1>
      <p className="text-slate-500 mb-1">
        Thank you for your purchase. {!isLoggedIn && "We've sent a confirmation to your email."}
      </p>
      {orderNumber && (
        <p className="text-sm text-slate-400 mb-8">
          Order number: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{orderNumber}</span>
        </p>
      )}
      <div className="flex items-center justify-center gap-3 mt-8">
        {isLoggedIn ? (
          <Link href="/account/orders">
            <Button size="lg" variant="outline">
              <Package className="h-4 w-4" /> View Orders
            </Button>
          </Link>
        ) : (
          <Link href={orderNumber ? `/track-order?order=${orderNumber}` : "/track-order"}>
            <Button size="lg" variant="outline">
              <Search className="h-4 w-4" /> Track Order
            </Button>
          </Link>
        )}
        <Link href="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
