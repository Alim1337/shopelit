"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Package, Search, MapPin, Truck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from "@/lib/utils";
import type { Order } from "@/types";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") || "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const params = new URLSearchParams({ orderNumber: orderNumber.trim(), email: email.trim() });
      const res = await fetch(`/api/orders/track?${params}`);
      const data = await res.json();
      if (!data.success) {
        setOrder(null);
        setError("We couldn't find an order matching that number and email.");
        return;
      }
      setOrder(data.data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-10">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4">
          <Package className="h-7 w-7 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Track Your Order</h1>
        <p className="text-slate-500 mt-2">Enter your order number and email to check the status.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
        <Input
          label="Order number"
          placeholder="e.g. ORD-20260813-ABCD"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
        />
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          <Search className="h-4 w-4" /> Track Order
        </Button>
      </form>

      {searched && !loading && error && (
        <div className="mt-6 text-center text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{order.orderNumber}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Placed on {formatDateTime(order.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${getOrderStatusColor(order.status)}`}>
                {order.status}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 p-4">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <Image src={item.image || "/images/product-placeholder.jpg"} alt={item.name} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Shipping Address
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                <br />
                {order.shippingAddress.addressLine1}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Delivery
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{order.shippingMethodName || "Standard"}</p>
              {order.trackingNumber && <p className="text-xs text-slate-500 mt-1">Tracking: {order.trackingNumber}</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderContent />
    </Suspense>
  );
}
