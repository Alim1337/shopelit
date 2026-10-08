"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Truck } from "lucide-react";
import { formatPrice, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from "@/lib/utils";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrder(data.data);
        else setError(data.error || "Order not found");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-sm text-slate-500">Loading order...</p>;
  if (error || !order) return <p className="text-sm text-red-500">{error || "Order not found"}</p>;

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{order.orderNumber}</h1>
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
            <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
              <Image src={item.image || "/images/product-placeholder.jpg"} alt={item.name} fill className="object-cover" sizes="64px" />
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
          {order.trackingNumber && (
            <p className="text-xs text-slate-500 mt-1">Tracking: {order.trackingNumber}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Shipping</span>
            <span>{formatPrice(order.shippingAmount)}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Tax</span>
            <span>{formatPrice(order.taxAmount)}</span>
          </div>
          {parseFloat(order.discountAmount) > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
