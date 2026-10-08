import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

// ============================================================
// TAILWIND CLASS MERGER
// ============================================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// SECURE RANDOM / ID GENERATION
// Uses the Web Crypto API (available in Node 20+, Edge and browsers),
// never Math.random(): session, reset and verification tokens must be
// unpredictable.
// ============================================================
function secureRandomString(chars: string, length: number): string {
  // Rejection sampling => every character is equally likely (no modulo bias)
  const limit = Math.floor(256 / chars.length) * chars.length;
  let out = "";
  while (out.length < length) {
    const bytes = new Uint8Array(length * 2);
    globalThis.crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b >= limit) continue;
      out += chars.charAt(b % chars.length);
      if (out.length === length) break;
    }
  }
  return out;
}

export function generateId(prefix?: string): string {
  const result = secureRandomString("abcdefghijklmnopqrstuvwxyz0123456789", 24);
  return prefix ? `${prefix}_${result}` : result;
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = secureRandomString("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);
  return `ORD-${timestamp}-${random}`;
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = secureRandomString("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 2);
  return `INV-${timestamp}-${random}`;
}

export function generateToken(length: number = 32): string {
  return secureRandomString(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    length
  );
}

// ============================================================
// CURRENCY FORMATTING
// ============================================================
export function formatCurrency(
  amount: number | string,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPrice(amount: number | string): string {
  return formatCurrency(amount, "DZD", "fr-DZ");
}

// ============================================================
// DATE FORMATTING
// ============================================================
export function formatDate(date: Date | string, fmt: string = "MMM d, yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// ============================================================
// SLUG GENERATION
// ============================================================
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ============================================================
// NUMBER FORMATTING
// ============================================================
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ============================================================
// DISCOUNT CALCULATION
// ============================================================
export function calculateDiscount(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function calculateSalePrice(
  price: number,
  discountPercentage: number
): number {
  return price - (price * discountPercentage) / 100;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{7,15}$/.test(phone);
}

// ============================================================
// STRING HELPERS
// ============================================================
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

// ============================================================
// ARRAY HELPERS
// ============================================================
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      return {
        ...groups,
        [groupKey]: [...(groups[groupKey] || []), item],
      };
    },
    {} as Record<string, T[]>
  );
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

// ============================================================
// URL HELPERS
// ============================================================
export function buildQueryString(
  params: Record<string, string | number | boolean | null | undefined>
): string {
  const query = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join("&");
  return query ? `?${query}` : "";
}

export function getProductUrl(slug: string): string {
  return `/products/${slug}`;
}

export function getCategoryUrl(slug: string): string {
  return `/categories/${slug}`;
}

export function getBrandUrl(slug: string): string {
  return `/brands/${slug}`;
}

// ============================================================
// ORDER STATUS HELPERS
// ============================================================
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-indigo-100 text-indigo-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    partially_refunded: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
    partially_refunded: "bg-orange-100 text-orange-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// ============================================================
// REVIEW STARS
// ============================================================
export function getRatingStars(rating: number): {
  full: number;
  half: boolean;
  empty: number;
} {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return { full, half, empty };
}

// ============================================================
// SAFE JSON PARSE
// ============================================================
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ============================================================
// IMAGE HELPERS
// ============================================================
export function getImageUrl(
  image: string | null | undefined,
  fallback: string = "/images/placeholder.jpg"
): string {
  if (!image) return fallback;
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `/${image}`;
}

export function getCloudinaryUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return "";
  const { width, height, quality = "auto", format = "auto" } = options;
  const transformParts: string[] = [
    `q_${quality}`,
    `f_${format}`,
    width ? `w_${width}` : "",
    height ? `h_${height}` : "",
    "c_fill",
  ].filter(Boolean) as string[];
  const transforms = transformParts.join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
}

// ============================================================
// SHIPPING & TAX CALCULATION
// ============================================================
export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calculateOrderTotal(
  subtotal: number,
  shipping: number,
  tax: number,
  discount: number
): number {
  return Math.max(0, subtotal + shipping + tax - discount);
}
