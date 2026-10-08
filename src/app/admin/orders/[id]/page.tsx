"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Phone, MapPin, Truck, StickyNote, User } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime, getOrderStatusColor, getPaymentStatusColor } from "@/lib/utils";
import type { Order } from "@/types";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`);
      const data = await res.json();
      if (data.success) setOrder(data.data);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusChange = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update order");
        return;
      }
      setOrder(data.data);
      toast.success(
        status === "delivered" ? "Order marked delivered — payment recorded as collected" : "Order status updated"
      );
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading order...</p>;
  if (!order) return <p className="text-sm text-red-500">Order not found.</p>;

  const address = order.shippingAddress;

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${getPaymentStatusColor(order.paymentStatus)}`}>
            {order.paymentStatus === "paid" ? "Cash collected" : "Payment pending"}
          </span>
          <select
            value={order.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-sm font-semibold rounded-lg border-0 px-3 py-1.5 capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${getOrderStatusColor(order.status)}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Call-to-confirm banner for new orders */}
      {order.status === "pending" && address.phone && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">New order — needs phone confirmation</p>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/70 mt-0.5">
              Call the customer to confirm the order, then mark it as &quot;confirmed&quot;.
            </p>
          </div>
          <a
            href={`tel:${address.phone}`}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            <Phone className="h-4 w-4" /> Call {address.phone}
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 p-4">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <Image src={item.image || "/images/product-placeholder.jpg"} alt={item.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Qty {item.quantity} · {formatPrice(item.price)} each</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                <StickyNote className="h-4 w-4" /> Customer Notes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{order.notes}</p>
            </div>
          )}

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery fee</span>
                <span>{formatPrice(order.shippingAmount)}</span>
              </div>
              {parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100 border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                <span>Total to collect</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <User className="h-4 w-4" /> Customer
            </h3>
            <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
              {address.firstName} {address.lastName}
            </p>
            {order.user?.email && <p className="text-xs text-slate-500 mt-0.5">{order.user.email}</p>}
            {!order.user && order.guestEmail && <p className="text-xs text-slate-500 mt-0.5">{order.guestEmail} (guest)</p>}
            {address.phone && (
              <a
                href={`tel:${address.phone}`}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" /> {address.phone}
              </a>
            )}
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Delivery Address
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {address.addressLine1}
              {address.addressLine2 && <>, {address.addressLine2}</>}
              <br />
              {address.city}{address.state ? `, ${address.state}` : ""}
              <br />
              {address.country}
            </p>
          </div>

          {/* Delivery company */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-1.5">
              <Truck className="h-4 w-4" /> Delivery Company
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{order.shippingMethodName || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
