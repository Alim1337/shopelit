"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatPrice, formatDate, getOrderStatusColor } from "@/lib/utils";

interface StatsResponse {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    revenueGrowth: number;
    ordersGrowth: number;
    customersGrowth: number;
  };
  revenueData: { date: string; revenue: number; orders: number }[];
  topProducts: { id: string; name: string; slug: string; thumbnail: string | null; soldCount: number; revenue: string }[];
  recentOrders: { id: string; orderNumber: string; status: string; total: string; createdAt: string }[];
  lowStockProducts: { id: string; name: string; slug: string; stock: number; lowStockThreshold: number | null }[];
  orderStatusBreakdown: { status: string; count: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#6366f1",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  delivered: "#22c55e",
  cancelled: "#ef4444",
  refunded: "#94a3b8",
  partially_refunded: "#fb923c",
};

function StatCard({
  icon: Icon,
  label,
  value,
  growth,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  growth?: number;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
          <Icon className="h-4.5 w-4.5 text-indigo-600" />
        </div>
        {growth !== undefined && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${growth >= 0 ? "text-green-600" : "text-red-500"}`}>
            {growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(growth)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500">Loading dashboard...</p>;
  if (!data) return <p className="text-sm text-red-500">Failed to load dashboard.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
        <p className="text-slate-500 mt-1">Last 30 days performance overview.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Revenue" value={formatPrice(data.stats.totalRevenue)} growth={data.stats.revenueGrowth} />
        <StatCard icon={ShoppingBag} label="Orders" value={data.stats.totalOrders.toString()} growth={data.stats.ordersGrowth} />
        <StatCard icon={Users} label="New Customers" value={data.stats.totalCustomers.toString()} growth={data.stats.customersGrowth} />
        <StatCard icon={Package} label="Active Products" value={data.stats.totalProducts.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Revenue Trend</h2>
            <span className="text-xs text-slate-500">Last 30 days</span>
          </div>
          {data.revenueData.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No revenue data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => formatDate(d, "MMM d")}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatPrice(v)}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(value) => [formatPrice(Number(value ?? 0)), "Revenue"]}
                  labelFormatter={(d) => formatDate(d as string, "MMM d, yyyy")}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Order Status</h2>
          {data.orderStatusBreakdown.length === 0 ? (
            <p className="text-sm text-slate-500 py-12 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.orderStatusBreakdown}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {data.orderStatusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [String(value ?? 0), String(name ?? "")]}
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs capitalize text-slate-600 dark:text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-indigo-600 font-medium hover:underline">View all</Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{order.orderNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${getOrderStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatPrice(order.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Top Products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {p.thumbnail && <Image src={p.thumbnail} alt={p.name} fill className="object-cover" sizes="40px" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.soldCount} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatPrice(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-5">
          <h2 className="font-semibold text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Low Stock Alert
          </h2>
          <div className="space-y-2">
            {data.lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">{p.name}</span>
                <span className="font-semibold text-amber-700 dark:text-amber-400">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
