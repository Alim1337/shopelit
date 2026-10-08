import { z } from "zod";

// ------------------------------------------------------------
// Shared validation for the admin coupons API (create + update)
// ------------------------------------------------------------
export const COUPON_TYPES = ["percentage", "fixed", "free_shipping"] as const;

export const couponInputSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters.")
    .max(50, "Code is too long.")
    .transform((s) => s.toUpperCase())
    .refine(
      (s) => /^[A-Z0-9_-]+$/.test(s),
      "Code can only contain letters, numbers, - and _."
    ),
  type: z.enum(COUPON_TYPES),
  value: z.number().min(0).max(1_000_000_000),
  minimumAmount: z.number().min(0).nullish(),
  maximumDiscount: z.number().min(0).nullish(),
  usageLimit: z.number().int().min(1).nullish(),
  usageLimitPerUser: z.number().int().min(1).nullish(),
  startsAt: z.iso.datetime().nullish(),
  expiresAt: z.iso.datetime().nullish(),
  description: z.string().trim().max(500).nullish(),
  isActive: z.boolean().optional(),
});

export type CouponInput = z.infer<typeof couponInputSchema>;

/** Cross-field rules. Returns an error message, or null when valid. */
export function validateCouponRules(d: CouponInput): string | null {
  if (d.type === "percentage" && !(d.value > 0 && d.value <= 100)) {
    return "A percentage coupon must be between 0 and 100.";
  }
  if (d.type === "fixed" && !(d.value > 0)) {
    return "A fixed-amount coupon must be greater than 0.";
  }
  if (d.startsAt && d.expiresAt && new Date(d.expiresAt) <= new Date(d.startsAt)) {
    return "The expiry date must be after the start date.";
  }
  return null;
}

/** Converts validated input into the values stored in the database. */
export function couponToDbValues(d: CouponInput) {
  return {
    code: d.code,
    type: d.type,
    // free-shipping coupons carry no amount
    value: (d.type === "free_shipping" ? 0 : d.value).toFixed(2),
    minimumAmount: d.minimumAmount != null ? d.minimumAmount.toFixed(2) : null,
    // a maximum discount only makes sense for percentage coupons
    maximumDiscount:
      d.type === "percentage" && d.maximumDiscount != null
        ? d.maximumDiscount.toFixed(2)
        : null,
    usageLimit: d.usageLimit ?? null,
    usageLimitPerUser: d.usageLimitPerUser ?? null,
    startsAt: d.startsAt ? new Date(d.startsAt) : null,
    expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
    description: d.description || null,
    isActive: d.isActive ?? true,
  };
}

/** True when a Postgres unique-constraint error bubbled up from the driver. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === "23505" || e?.cause?.code === "23505";
}
