import { z } from "zod";

// ============================================================
// AUTH SCHEMAS
// ============================================================

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
    token: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ============================================================
// ADDRESS SCHEMA
// ============================================================

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  company: z.string().max(200).optional(),
  addressLine1: z.string().min(1, "Address is required").max(500),
  addressLine2: z.string().max(500).optional(),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
  type: z.enum(["billing", "shipping", "both"]).optional(),
});

// ============================================================
// PRODUCT SCHEMA
// ============================================================

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(500),
  slug: z.string().min(1).max(500).optional(),
  sku: z.string().min(1, "SKU is required").max(100),
  description: z.string().optional(),
  richDescription: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: z.enum(["draft", "active", "inactive", "archived"]).default("draft"),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional().default(0),
  stock: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).optional().default(10),
  allowBackorder: z.boolean().default(false),
  weight: z.number().positive().optional(),
  weightUnit: z.string().max(10).optional().default("kg"),
  images: z.array(z.string()).default([]),
  thumbnail: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isOnSale: z.boolean().default(false),
  saleStartDate: z.string().optional().or(z.literal("")),
  saleEndDate: z.string().optional().or(z.literal("")),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

// ============================================================
// CHECKOUT SCHEMA
// ============================================================

export const checkoutSchema = z.object({
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  sameAsShipping: z.boolean().optional(),
  shippingMethodId: z.string().min(1, "Please select a shipping method"),
  notes: z.string().max(1000).optional(),
  couponCode: z.string().max(50).optional(),
});

// ============================================================
// REVIEW SCHEMA
// ============================================================

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().min(10, "Review must be at least 10 characters").max(5000),
  images: z.array(z.string()).default([]),
});

// ============================================================
// COUPON SCHEMA
// ============================================================

export const couponSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.number().positive(),
  minimumAmount: z.number().positive().optional(),
  maximumDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  usageLimitPerUser: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  startsAt: z.date().optional(),
  expiresAt: z.date().optional(),
  description: z.string().max(500).optional(),
});

// ============================================================
// NEWSLETTER SCHEMA
// ============================================================

export const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().max(200).optional(),
});

// ============================================================
// PROFILE UPDATE SCHEMA
// ============================================================

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).optional(),
  avatar: z.string().optional(),
});

// ============================================================
// SEARCH SCHEMA
// ============================================================

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "rating", "newest", "bestseller", "name"])
    .optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ============================================================
// CONTACT SCHEMA
// ============================================================

export const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  message: z.string().min(10).max(5000),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type NewsletterInput = z.infer<typeof newsletterSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
