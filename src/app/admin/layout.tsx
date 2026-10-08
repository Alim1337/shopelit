import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Users, Star, Tag, Truck, Layers, Ticket, ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import NotificationBell from "@/components/admin/notification-bell";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/brands", label: "Brands", icon: Layers },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/delivery-companies", label: "Delivery Companies", icon: Truck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin" && user.role !== "super_admin") redirect("/");

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 print:hidden">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100">Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to store
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="h-14 flex items-center justify-between px-4 lg:px-8 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 print:hidden">
          <span className="font-bold text-slate-900 dark:text-slate-100 lg:hidden">Admin</span>
          <div className="flex-1" />
          <NotificationBell />
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
