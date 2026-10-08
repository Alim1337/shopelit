// ============================================================
// CORE TYPE DEFINITIONS
// ============================================================

export type UserRole = "customer" | "admin" | "super_admin";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "partially_refunded";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";
export type ProductStatus = "draft" | "active" | "inactive" | "archived";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type CouponType = "percentage" | "fixed" | "free_shipping";

// ============================================================
// USER TYPES
// ============================================================

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  lastLoginAt: Date | null;
  stripeCustomerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  emailVerified: boolean;
}

// ============================================================
// ADDRESS TYPES
// ============================================================

export interface Address {
  id: string;
  userId?: string | null;
  type: "billing" | "shipping" | "both";
  firstName: string;
  lastName: string;
  company?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// PRODUCT TYPES
// ============================================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  richDescription: string | null;
  categoryId: string | null;
  brandId: string | null;
  status: ProductStatus;
  price: string;
  compareAtPrice: string | null;
  costPrice: string | null;
  discountPercentage: string | null;
  taxRate: string | null;
  stock: number;
  lowStockThreshold: number | null;
  allowBackorder: boolean;
  weight: string | null;
  weightUnit: string | null;
  dimensions: ProductDimensions | null;
  images: string[];
  thumbnail: string | null;
  videoUrl: string | null;
  tags: string[];
  colors: string[];
  sizes: string[];
  specifications: Record<string, string> | null;
  attributes: Record<string, string> | null;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isOnSale: boolean;
  saleStartDate: Date | null;
  saleEndDate: Date | null;
  rating: string;
  reviewCount: number;
  soldCount: number;
  viewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: Category | null;
  brand?: Brand | null;
  variants?: ProductVariant[];
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: string;
  compareAtPrice: string | null;
  stock: number;
  image: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  attributes: Record<string, string> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// CATEGORY TYPES
// ============================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
  parent?: Category | null;
  _count?: { products: number };
}

// ============================================================
// BRAND TYPES
// ============================================================

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { products: number };
}

// ============================================================
// ORDER TYPES
// ============================================================

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  stripePaymentIntentId: string | null;
  couponId: string | null;
  couponCode: string | null;
  subtotal: string;
  discountAmount: string;
  shippingAmount: string;
  taxAmount: string;
  total: string;
  currency: string;
  shippingMethodName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  estimatedDelivery: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  notes: string | null;
  guestEmail: string | null;
  invoiceNumber: string | null;
  refundAmount: string | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items?: OrderItem[];
  user?: User | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string | null;
  name: string;
  sku: string | null;
  image: string | null;
  quantity: number;
  price: string;
  total: string;
  discount: string;
  attributes: Record<string, string> | null;
  createdAt: Date;
}

export interface OrderAddress {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  phone?: string;
}

// ============================================================
// CART TYPES
// ============================================================

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: string;
  savedForLater: boolean;
  createdAt: Date;
  updatedAt: Date;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string | null;
  couponId: string | null;
  notes: string | null;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// REVIEW TYPES
// ============================================================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: number;
  title: string | null;
  content: string | null;
  images: string[];
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  adminReply: string | null;
  adminReplyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: Pick<User, "id" | "name" | "avatar">;
}

// ============================================================
// COUPON TYPES
// ============================================================

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  minimumAmount: string | null;
  maximumDiscount: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// BLOG TYPES
// ============================================================

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image: string | null;
  authorId: string;
  categoryId: string | null;
  status: "draft" | "published" | "archived";
  tags: string[];
  readTime: number | null;
  viewCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: Pick<User, "id" | "name" | "avatar">;
  category?: { id: string; name: string; slug: string } | null;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  isOnSale?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  sortBy?: "price_asc" | "price_desc" | "rating" | "newest" | "bestseller" | "name";
  page?: number;
  limit?: number;
}

// ============================================================
// CHECKOUT TYPES
// ============================================================

export interface CheckoutData {
  billingAddress: OrderAddress;
  shippingAddress: OrderAddress;
  shippingMethodId: string;
  paymentMethodId?: string;
  couponCode?: string;
  notes?: string;
  sameAsShipping?: boolean;
}

// ============================================================
// DASHBOARD ANALYTICS TYPES
// ============================================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  customersGrowth: number;
  productsGrowth: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}
