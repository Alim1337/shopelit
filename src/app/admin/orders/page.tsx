"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Phone, ChevronRight, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate, getOrderStatusColor } from "@/lib/utils";
import type { OrderAddress } from "@/types";

interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string;
  createdAt: string;
  guestEmail: string | null;
  shippingAddress: OrderAddress;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  user: { id: string; name: string | null; email: string } | null;
}

interface DeliveryCompany {
  id: string;
  name: string;
}

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "100" });
      if (search) params.set("search", search);
      if (companyFilter) params.set("shippingMethodId", companyFilter);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (data.success) setOrders(data.data.data);
    } finally {
      setLoading(false);
    }
  }, [search, companyFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOrders, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  useEffect(() => {
    fetch("/api/admin/delivery-companies")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setCompanies(data.data);
      });
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update order");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      toast.success(
        status === "delivered" ? "Order marked delivered — payment recorded as collected" : "Order status updated"
      );
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order Number", "Customer", "Phone", "Address", "City", "Wilaya", "Delivery Company", "Amount to Collect (DZD)", "Status"];
    const rows = orders.map((o) => [
      o.orderNumber,
      `${o.shippingAddress?.firstName || ""} ${o.shippingAddress?.lastName || ""}`.trim(),
      o.shippingAddress?.phone || "",
      o.shippingAddress?.addressLine1 || "",
      o.shippingAddress?.city || "",
      o.shippingAddress?.state || "",
      o.shippingMethodName || "",
      o.total,
      o.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvField(String(cell))).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `commandes-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${orders.length} commande(s) exportée(s)`);
  };

  const handlePrint = () => {
    if (orders.length === 0) {
      toast.error("No orders to print");
      return;
    }
    const params = new URLSearchParams();
    if (companyFilter) params.set("shippingMethodId", companyFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    window.open(`/admin/orders/print?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Orders</h1>
        <p className="text-slate-500 mt-1">{orders.length} orders · Cash on delivery</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Search by order number or email..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Delivery company</label>
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-[42px] rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3 text-sm capitalize focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="flex-1" />

        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print Manifest
        </Button>
        <Button variant="outline" onClick={handleExportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Order</th>
              <th className="text-left px-5 py-3 font-medium">Customer</th>
              <th className="text-left px-5 py-3 font-medium">Phone</th>
              <th className="text-left px-5 py-3 font-medium">Delivery Co.</th>
              <th className="text-left px-5 py-3 font-medium">Date</th>
              <th className="text-left px-5 py-3 font-medium">Total</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-8 text-center text-slate-500">No orders found.</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                    {o.shippingAddress?.firstName} {o.shippingAddress?.lastName}
                  </td>
                  <td className="px-5 py-3">
                    {o.shippingAddress?.phone ? (
                      <a
                        href={`tel:${o.shippingAddress.phone}`}
                        className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-medium transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5" /> {o.shippingAddress.phone}
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{o.shippingMethodName || "—"}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs font-semibold rounded-lg border-0 px-2.5 py-1 capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${getOrderStatusColor(o.status)}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/orders/${o.id}`} aria-label="View order details">
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
