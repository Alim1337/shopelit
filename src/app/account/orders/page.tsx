"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate, getOrderStatusColor } from "@/lib/utils";
import type { Order } from "@/types";

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Orders</h1>
        <p className="text-slate-500 mt-1">Track and review your past orders.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">You haven&apos;t placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{order.orderNumber}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${getOrderStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice(order.total)}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
