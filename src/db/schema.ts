import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  serial,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", [
  "customer",
  "admin",
  "super_admin",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "partially_refunded",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash_on_delivery",
  "stripe",
  "paypal",
  "apple_pay",
  "google_pay",
  "bank_transfer",
]);
export const couponTypeEnum = pgEnum("coupon_type", [
  "percentage",
  "fixed",
  "free_shipping",
]);
export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "approved",
  "rejected",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "order",
  "payment",
  "shipping",
  "promotion",
  "system",
  "review",
]);
export const addressTypeEnum = pgEnum("address_type", [
  "billing",
  "shipping",
  "both",
]);
export const productStatusEnum = pgEnum("product_status", [
  "draft",
  "active",
  "inactive",
  "archived",
]);
export const blogStatusEnum = pgEnum("blog_status", [
  "draft",
  "published",
  "archived",
]);
export const returnStatusEnum = pgEnum("return_status", [
  "pending",
  "approved",
  "rejected",
  "completed",
]);

// ============================================================
// USERS & AUTH
// ============================================================

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    name: varchar("name", { length: 255 }),
    firstName: varchar("first_name", { length: 100 }),
    lastName: varchar("last_name", { length: 100 }),
    avatar: text("avatar"),
    phone: varchar("phone", { length: 20 }),
    role: userRoleEnum("role").default("customer").notNull(),
    passwordHash: text("password_hash"),
    isActive: boolean("is_active").default(true).notNull(),
    isBanned: boolean("is_banned").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at"),
    metadata: jsonb("metadata"),
    stripeCustomerId: text("stripe_customer_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("sessions_token_idx").on(t.token)]
);

export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("oauth_accounts_provider_account_idx").on(
      t.provider,
      t.providerAccountId
    ),
  ]
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// ADDRESSES
// ============================================================

export const addresses = pgTable("addresses", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  type: addressTypeEnum("type").default("both").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 200 }),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// CATEGORIES
// ============================================================

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description"),
    image: text("image"),
    parentId: text("parent_id"),
    level: integer("level").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug)]
);

// ============================================================
// BRANDS
// ============================================================

export const brands = pgTable(
  "brands",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description"),
    logo: text("logo"),
    website: text("website"),
    isActive: boolean("is_active").default(true).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("brands_slug_idx").on(t.slug)]
);

// ============================================================
// PRODUCTS
// ============================================================

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull(),
    sku: varchar("sku", { length: 100 }).notNull(),
    description: text("description"),
    richDescription: text("rich_description"),
    categoryId: text("category_id").references(() => categories.id),
    brandId: text("brand_id").references(() => brands.id),
    status: productStatusEnum("status").default("draft").notNull(),
    price: decimal("price", { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }),
    costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
    discountPercentage: decimal("discount_percentage", {
      precision: 5,
      scale: 2,
    }),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
    stock: integer("stock").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10),
    allowBackorder: boolean("allow_backorder").default(false).notNull(),
    weight: decimal("weight", { precision: 8, scale: 2 }),
    weightUnit: varchar("weight_unit", { length: 10 }).default("kg"),
    dimensions: jsonb("dimensions"),
    images: jsonb("images").$type<string[]>().default([]),
    thumbnail: text("thumbnail"),
    videoUrl: text("video_url"),
    tags: jsonb("tags").$type<string[]>().default([]),
    colors: jsonb("colors").$type<string[]>().default([]),
    sizes: jsonb("sizes").$type<string[]>().default([]),
    specifications: jsonb("specifications"),
    attributes: jsonb("attributes"),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isNewArrival: boolean("is_new_arrival").default(false).notNull(),
    isBestSeller: boolean("is_best_seller").default(false).notNull(),
    isOnSale: boolean("is_on_sale").default(false).notNull(),
    saleStartDate: timestamp("sale_start_date"),
    saleEndDate: timestamp("sale_end_date"),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
    reviewCount: integer("review_count").default(0).notNull(),
    soldCount: integer("sold_count").default(0).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_category_idx").on(t.categoryId),
    index("products_brand_idx").on(t.brandId),
    index("products_status_idx").on(t.status),
  ]
);

export const productVariants = pgTable("product_variants", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 200 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }),
  stock: integer("stock").default(0).notNull(),
  image: text("image"),
  color: varchar("color", { length: 50 }),
  size: varchar("size", { length: 50 }),
  material: varchar("material", { length: 100 }),
  attributes: jsonb("attributes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryHistory = pgTable("inventory_history", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  variantId: text("variant_id").references(() => productVariants.id),
  type: varchar("type", { length: 50 }).notNull(),
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason"),
  userId: text("user_id").references(() => users.id),
  orderId: text("order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// REVIEWS
// ============================================================

export const reviews = pgTable(
  "reviews",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: text("order_id"),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 200 }),
    content: text("content"),
    images: jsonb("images").$type<string[]>().default([]),
    status: reviewStatusEnum("status").default("pending").notNull(),
    isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
    helpfulCount: integer("helpful_count").default(0).notNull(),
    adminReply: text("admin_reply"),
    adminReplyAt: timestamp("admin_reply_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)]
);

export const reviewHelpful = pgTable(
  "review_helpful",
  {
    id: text("id").primaryKey(),
    reviewId: text("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("review_helpful_unique_idx").on(t.reviewId, t.userId),
  ]
);

// ============================================================
// WISHLISTS
// ============================================================

export const wishlists = pgTable(
  "wishlists",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: text("variant_id").references(() => productVariants.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("wishlists_user_product_idx").on(t.userId, t.productId)]
);

// ============================================================
// CART
// ============================================================

export const carts = pgTable("carts", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  couponId: text("coupon_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: text("id").primaryKey(),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  variantId: text("variant_id").references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  savedForLater: boolean("saved_for_later").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// COUPONS
// ============================================================

export const coupons = pgTable(
  "coupons",
  {
    id: text("id").primaryKey(),
    code: varchar("code", { length: 50 }).notNull(),
    type: couponTypeEnum("type").notNull(),
    value: decimal("value", { precision: 12, scale: 2 }).notNull(),
    minimumAmount: decimal("minimum_amount", { precision: 12, scale: 2 }),
    maximumDiscount: decimal("maximum_discount", { precision: 12, scale: 2 }),
    usageLimit: integer("usage_limit"),
    usageLimitPerUser: integer("usage_limit_per_user"),
    usedCount: integer("used_count").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    startsAt: timestamp("starts_at"),
    expiresAt: timestamp("expires_at"),
    description: text("description"),
    applicableCategories: jsonb("applicable_categories")
      .$type<string[]>()
      .default([]),
    applicableProducts: jsonb("applicable_products")
      .$type<string[]>()
      .default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("coupons_code_idx").on(t.code)]
);

export const couponUsages = pgTable("coupon_usages", {
  id: text("id").primaryKey(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  orderId: text("order_id"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// SHIPPING
// ============================================================

export const shippingZones = pgTable("shipping_zones", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  countries: jsonb("countries").$type<string[]>().default([]),
  states: jsonb("states").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shippingMethods = pgTable("shipping_methods", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id")
    .notNull()
    .references(() => shippingZones.id),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  freeShippingThreshold: decimal("free_shipping_threshold", {
    precision: 12,
    scale: 2,
  }),
  estimatedDays: integer("estimated_days"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// ORDERS
// ============================================================

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    orderNumber: varchar("order_number", { length: 50 }).notNull(),
    userId: text("user_id").references(() => users.id),
    status: orderStatusEnum("status").default("pending").notNull(),
    paymentStatus: paymentStatusEnum("payment_status")
      .default("pending")
      .notNull(),
    paymentMethod: paymentMethodEnum("payment_method"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    stripeChargeId: text("stripe_charge_id"),
    couponId: text("coupon_id").references(() => coupons.id),
    couponCode: varchar("coupon_code", { length: 50 }),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
    shippingAmount: decimal("shipping_amount", { precision: 12, scale: 2 }).default("0"),
    taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
    total: decimal("total", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD").notNull(),
    shippingMethodId: text("shipping_method_id").references(
      () => shippingMethods.id
    ),
    shippingMethodName: varchar("shipping_method_name", { length: 200 }),
    trackingNumber: varchar("tracking_number", { length: 200 }),
    trackingUrl: text("tracking_url"),
    estimatedDelivery: timestamp("estimated_delivery"),
    shippedAt: timestamp("shipped_at"),
    deliveredAt: timestamp("delivered_at"),
    billingAddress: jsonb("billing_address").notNull(),
    shippingAddress: jsonb("shipping_address").notNull(),
    notes: text("notes"),
    guestEmail: varchar("guest_email", { length: 255 }),
    invoiceNumber: varchar("invoice_number", { length: 50 }),
    invoiceUrl: text("invoice_url"),
    refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
    refundReason: text("refund_reason"),
    cancelledAt: timestamp("cancelled_at"),
    cancelReason: text("cancel_reason"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_order_number_idx").on(t.orderNumber),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
  ]
);

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  variantId: text("variant_id").references(() => productVariants.id),
  name: varchar("name", { length: 500 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  image: text("image"),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 12, scale: 2 }).default("0"),
  attributes: jsonb("attributes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const returns = pgTable("returns", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  reason: text("reason").notNull(),
  status: returnStatusEnum("status").default("pending").notNull(),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
  images: jsonb("images").$type<string[]>().default([]),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// BLOG
// ============================================================

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: text("id").primaryKey(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 200 }).notNull(),
    description: text("description"),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("blog_categories_slug_idx").on(t.slug)]
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: text("id").primaryKey(),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull(),
    excerpt: text("excerpt"),
    content: text("content").notNull(),
    image: text("image"),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    categoryId: text("category_id").references(() => blogCategories.id),
    status: blogStatusEnum("status").default("draft").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    readTime: integer("read_time").default(5),
    viewCount: integer("view_count").default(0).notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("blog_posts_slug_idx").on(t.slug)]
);

// ============================================================
// CMS / SETTINGS
// ============================================================

export const settings = pgTable(
  "settings",
  {
    id: text("id").primaryKey(),
    key: varchar("key", { length: 200 }).notNull(),
    value: jsonb("value"),
    group: varchar("group", { length: 100 }).default("general"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("settings_key_idx").on(t.key)]
);

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  url: text("url").notNull(),
  publicId: text("public_id"),
  type: varchar("type", { length: 50 }).notNull(),
  size: integer("size"),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt"),
  uploadedBy: text("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// AUDIT LOGS
// ============================================================

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    action: varchar("action", { length: 200 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: text("entity_id"),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("audit_logs_user_idx").on(t.userId)]
);

// ============================================================
// NEWSLETTER
// ============================================================

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 200 }),
    isActive: boolean("is_active").default(true).notNull(),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
  },
  (t) => [uniqueIndex("newsletter_subscribers_email_idx").on(t.email)]
);

// ============================================================
// PRODUCT COMPARISONS & SEARCH
// ============================================================

export const searchHistory = pgTable("search_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id"),
  query: text("query").notNull(),
  resultsCount: integer("results_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
  blogPosts: many(blogPosts),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "categoryChildren",
  }),
  children: many(categories, { relationName: "categoryChildren" }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
  reviews: many(reviews),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  inventoryHistory: many(inventoryHistory),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  coupon: one(coupons, {
    fields: [orders.couponId],
    references: [coupons.id],
  }),
  returns: many(returns),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
}));
