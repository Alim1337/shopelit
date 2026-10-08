import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Package, Settings, LayoutDashboard, MapPin } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import VerifyEmailBanner from "@/components/account/verify-email-banner";

const NAV = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sticky top-24">
              <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name || "User"}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Link>
                ))}
                {(user.role === "admin" || user.role === "super_admin") && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                  </Link>
                )}
              </nav>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {!user.emailVerified && <VerifyEmailBanner email={user.email} />}
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
