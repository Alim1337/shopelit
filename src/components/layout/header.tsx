"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  LogOut,
  Settings,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useUIStore } from "@/store/ui.store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Button } from "@/components/ui/button";
import SearchAutocomplete from "@/components/layout/search-autocomplete";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface HeaderProps {
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatar: string | null;
  } | null;
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  {
    href: "/products",
    label: "Products",
    submenu: [
      { href: "/products?isFeatured=true", label: "Featured" },
      { href: "/products?isNewArrival=true", label: "New Arrivals" },
      { href: "/products?isBestSeller=true", label: "Best Sellers" },
      { href: "/products?isOnSale=true", label: "Sale" },
    ],
  },
  { href: "/categories", label: "Categories" },
  { href: "/brands", label: "Brands" },
  { href: "/blog", label: "Blog" },
];

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const hasMounted = useHasMounted();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.getCount());
  const { isSearchOpen, openSearch, closeSearch, isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Initialize dark mode from localStorage, defaulting to light
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const isDark = saved === "dark";
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    const html = document.documentElement;
    const nowDark = html.classList.toggle("dark");
    localStorage.setItem("theme", nowDark ? "dark" : "light");
    setDarkMode(nowDark);
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        closeSearch();
        setSearchQuery("");
      }
    },
    [router, closeSearch]
  );

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to logout");
    }
  };

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white text-xs text-center py-2 px-4">
        🎉 Paiement à la livraison partout en Algérie | Utilisez le code <strong>WELCOME10</strong> pour 10% de réduction sur votre première commande !
      </div>

      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-300",
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100 dark:bg-slate-900/90 dark:border-slate-800"
            : "bg-white dark:bg-slate-900"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                ShopElite
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => link.submenu && setActiveDropdown(link.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-all dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-indigo-950"
                    )}
                  >
                    {link.label}
                    {link.submenu && (
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", activeDropdown === link.label && "rotate-180")} />
                    )}
                  </Link>

                  <AnimatePresence>
                    {link.submenu && activeDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 top-full mt-1 w-48 rounded-xl bg-white border border-slate-100 shadow-xl p-1.5 dark:bg-slate-900 dark:border-slate-800"
                      >
                        {link.submenu.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 transition-colors"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <button
                onClick={openSearch}
                className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {hasMounted && wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => useCartStore.getState().openCart()}
                className="relative p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {hasMounted && cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </motion.span>
                )}
              </button>

              {/* User */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name || ""} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 hidden sm:block" />
                  </button>

                  <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-white border border-slate-100 shadow-xl p-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all dark:bg-slate-900 dark:border-slate-800">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name || "User"}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <Link href="/account" className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 transition-colors">
                      <User className="h-4 w-4" /> My Account
                    </Link>
                    <Link href="/account/orders" className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 transition-colors">
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    {(user.role === "admin" || user.role === "super_admin") && (
                      <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 transition-colors">
                        <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                      </Link>
                    )}
                    <Link href="/account/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-indigo-950 transition-colors">
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/auth/login" className="inline-flex items-center justify-center h-8 px-4 text-xs font-semibold rounded-xl text-slate-700 hover:bg-slate-100 transition-all dark:text-slate-300 dark:hover:bg-slate-800">
                    Sign In
                  </Link>
                  <Link href="/auth/register" className="inline-flex items-center justify-center h-8 px-4 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all">
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-300 dark:hover:bg-indigo-950 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                  <Link href="/auth/login" onClick={closeMobileMenu} className="flex-1 inline-flex items-center justify-center h-8 px-4 text-xs font-semibold rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all">
                    Sign In
                  </Link>
                  <Link href="/auth/register" onClick={closeMobileMenu} className="flex-1 inline-flex items-center justify-center h-8 px-4 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
                    Get Started
                  </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeSearch}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mt-20 px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
                autoFocus
                inputClassName="w-full h-14 rounded-2xl bg-white dark:bg-slate-900 border-0 shadow-2xl px-6 pr-14 text-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}