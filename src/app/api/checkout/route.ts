import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  orderItems,
  products,
  productVariants,
  inventoryHistory,
  coupons,
  couponUsages,
  shippingMethods,
  users,
  notifications,
} from "@/db/schema";
import { checkoutSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/session";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";
import {
  generateId,
  generateOrderNumber,
  generateInvoiceNumber,
} from "@/lib/utils";
import { sendOrderConfirmationEmail } from "@/lib/email";

// ------------------------------------------------------------
// Request validation
// The client's price is intentionally NOT part of this schema:
// prices are always read from the database.
// ------------------------------------------------------------
const MAX_QTY_PER_LINE = 20;

const itemSchema = z.object({
  productId: z.string().min(1).max(100),
  variantId: z.string().min(1).max(100).nullish(),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_LINE),
});

const checkoutRequestSchema = checkoutSchema.extend({
  items: z.array(itemSchema).min(1, "Cart is empty.").max(50),
  guestEmail: z.string().email().max(255).optional(),
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
class CheckoutError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Money is computed in integer cents to avoid floating point drift.
const toCents = (v: string | number) => Math.round(Number(v) * 100);
const fromCents = (c: number) => (c / 100).toFixed(2);

export async function POST(req: NextRequest) {
  try {
    // Throttle order spam (5 orders / 10 min / IP)
    const ip = getIpAddress(req);
    const { success: allowed } = rateLimit(`checkout:${ip}`, 5, 10 * 60 * 1000);
    if (!allowed) {
      return errorResponse(
        "Too many orders from this connection. Please try again in a few minutes.",
        429
      );
    }

    const user = await getCurrentUser();
    const body = await req.json().catch(() => null);
    const parsed = checkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const {
      billingAddress,
      shippingAddress,
      shippingMethodId,
      couponCode,
      notes,
      guestEmail,
      items,
    } = parsed.data;

    if (!shippingAddress.phone || shippingAddress.phone.trim().length < 8) {
      return errorResponse(
        "A valid phone number is required so we can confirm your order.",
        400
      );
    }

    // Merge duplicate lines (same product + variant) so limits can't be bypassed
    const merged = new Map<
      string,
      { productId: string; variantId: string | null; quantity: number }
    >();
    for (const it of items) {
      const key = `${it.productId}:${it.variantId ?? ""}`;
      const existing = merged.get(key);
      if (existing) existing.quantity += it.quantity;
      else
        merged.set(key, {
          productId: it.productId,
          variantId: it.variantId ?? null,
          quantity: it.quantity,
        });
    }
    // Stable order => consistent row-lock order => no deadlocks between orders
    const lines = [...merged.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    if (lines.some((l) => l.quantity > MAX_QTY_PER_LINE * 2)) {
      return errorResponse("Quantity too large for one item.", 400);
    }

    const orderId = generateId("ord");
    const orderNumber = generateOrderNumber();
    const invoiceNumber = generateInvoiceNumber();

    const result = await db.transaction(async (tx) => {
      // ---- Shipping method -------------------------------------------------
      const [shippingMethod] = await tx
        .select()
        .from(shippingMethods)
        .where(
          and(
            eq(shippingMethods.id, shippingMethodId),
            eq(shippingMethods.isActive, true)
          )
        )
        .limit(1);

      if (!shippingMethod) {
        throw new CheckoutError("Invalid shipping method.");
      }

      // ---- Load products & variants in one go ------------------------------
      const productIds = [...new Set(lines.map((l) => l.productId))];
      const variantIds = lines
        .map((l) => l.variantId)
        .filter((v): v is string => !!v);

      const productRows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, productIds));
      const productMap = new Map(productRows.map((p) => [p.id, p]));

      const variantRows = variantIds.length
        ? await tx
            .select()
            .from(productVariants)
            .where(inArray(productVariants.id, variantIds))
        : [];
      const variantMap = new Map(variantRows.map((v) => [v.id, v]));

      // ---- Validate lines & price them from the database -------------------
      let subtotalCents = 0;
      const priced = lines.map((line) => {
        const product = productMap.get(line.productId);
        if (!product || product.status !== "active") {
          throw new CheckoutError(
            "One of the items in your cart is no longer available."
          );
        }

        const variant = line.variantId ? variantMap.get(line.variantId) : null;
        if (line.variantId) {
          if (!variant || variant.productId !== product.id || !variant.isActive) {
            throw new CheckoutError(
              `"${product.name}" is no longer available in that option.`
            );
          }
        }

        const unitCents = toCents(variant ? variant.price : product.price);
        const totalCents = unitCents * line.quantity;
        subtotalCents += totalCents;

        return {
          line,
          product,
          variant: variant ?? null,
          name: variant ? `${product.name} — ${variant.name}` : product.name,
          sku: variant?.sku ?? product.sku,
          image: variant?.image ?? product.thumbnail,
          unitCents,
          totalCents,
        };
      });

      // ---- Coupon ----------------------------------------------------------
      let discountCents = 0;
      let shippingCents = toCents(shippingMethod.price);
      let appliedCouponId: string | null = null;
      const normalizedCode = couponCode?.trim().toUpperCase() || null;

      if (normalizedCode) {
        const [coupon] = await tx
          .select()
          .from(coupons)
          .where(eq(coupons.code, normalizedCode))
          .limit(1);

        const now = new Date();
        if (!coupon || !coupon.isActive) {
          throw new CheckoutError("This coupon is not valid.");
        }
        if (coupon.startsAt && coupon.startsAt > now) {
          throw new CheckoutError("This coupon is not active yet.");
        }
        if (coupon.expiresAt && coupon.expiresAt < now) {
          throw new CheckoutError("This coupon has expired.");
        }
        if (
          coupon.minimumAmount &&
          subtotalCents < toCents(coupon.minimumAmount)
        ) {
          throw new CheckoutError(
            `This coupon requires a minimum order of ${coupon.minimumAmount}.`
          );
        }

        // Per-user limits can only be tracked for signed-in customers
        if (coupon.usageLimitPerUser) {
          if (!user) {
            throw new CheckoutError("Please sign in to use this coupon.");
          }
          // Stops throwaway accounts from reusing "once per customer" coupons
          if (!user.emailVerified) {
            throw new CheckoutError(
              "Please verify your email address to use this coupon."
            );
          }
          const [{ used }] = await tx
            .select({ used: sql<number>`count(*)::int` })
            .from(couponUsages)
            .where(
              and(
                eq(couponUsages.couponId, coupon.id),
                eq(couponUsages.userId, user.id)
              )
            );
          if (used >= coupon.usageLimitPerUser) {
            throw new CheckoutError("You have already used this coupon.");
          }
        }

        // Atomically claim one use (race-safe against the global limit)
        const claimed = await tx
          .update(coupons)
          .set({ usedCount: sql`${coupons.usedCount} + 1` })
          .where(
            and(
              eq(coupons.id, coupon.id),
              or(
                isNull(coupons.usageLimit),
                sql`${coupons.usedCount} < ${coupons.usageLimit}`
              )
            )
          )
          .returning({ id: coupons.id });

        if (!claimed.length) {
          throw new CheckoutError("This coupon has reached its usage limit.");
        }

        if (coupon.type === "percentage") {
          discountCents = Math.round(
            (subtotalCents * Number(coupon.value)) / 100
          );
          if (coupon.maximumDiscount) {
            discountCents = Math.min(
              discountCents,
              toCents(coupon.maximumDiscount)
            );
          }
        } else if (coupon.type === "fixed") {
          discountCents = Math.min(toCents(coupon.value), subtotalCents);
        } else if (coupon.type === "free_shipping") {
          shippingCents = 0;
        }
        discountCents = Math.min(discountCents, subtotalCents);
        appliedCouponId = coupon.id;
      }

      const totalCents = Math.max(
        0,
        subtotalCents - discountCents + shippingCents
      );

      // ---- Create the order ------------------------------------------------
      await tx.insert(orders).values({
        id: orderId,
        orderNumber,
        userId: user?.id ?? null,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "cash_on_delivery",
        couponId: appliedCouponId,
        couponCode: normalizedCode,
        subtotal: fromCents(subtotalCents),
        discountAmount: fromCents(discountCents),
        shippingAmount: fromCents(shippingCents),
        taxAmount: "0.00",
        total: fromCents(totalCents),
        currency: "DZD",
        shippingMethodId,
        shippingMethodName: shippingMethod.name,
        billingAddress,
        shippingAddress,
        notes: notes ?? null,
        guestEmail: user ? null : guestEmail ?? null,
        invoiceNumber,
      });

      // ---- Decrement stock atomically + log it -----------------------------
      for (const p of priced) {
        const qty = p.line.quantity;
        const backorder = p.product.allowBackorder;
        let newStock: number;

        if (p.variant) {
          const updated = await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${qty}` })
            .where(
              and(
                eq(productVariants.id, p.variant.id),
                backorder ? undefined : gte(productVariants.stock, qty)
              )
            )
            .returning({ stock: productVariants.stock });
          if (!updated.length) {
            throw new CheckoutError(`${p.name} is out of stock.`, 409);
          }
          newStock = updated[0].stock;

          await tx
            .update(products)
            .set({ soldCount: sql`${products.soldCount} + ${qty}` })
            .where(eq(products.id, p.product.id));
        } else {
          const updated = await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${qty}`,
              soldCount: sql`${products.soldCount} + ${qty}`,
            })
            .where(
              and(
                eq(products.id, p.product.id),
                backorder ? undefined : gte(products.stock, qty)
              )
            )
            .returning({ stock: products.stock });
          if (!updated.length) {
            throw new CheckoutError(`${p.name} is out of stock.`, 409);
          }
          newStock = updated[0].stock;
        }

        await tx.insert(inventoryHistory).values({
          id: generateId("inv"),
          productId: p.product.id,
          variantId: p.variant?.id ?? null,
          type: "sale",
          quantity: -qty,
          previousStock: newStock + qty,
          newStock,
          reason: `Order ${orderNumber}`,
          userId: user?.id ?? null,
          orderId,
        });
      }

      // ---- Order items -----------------------------------------------------
      await tx.insert(orderItems).values(
        priced.map((p) => ({
          id: generateId("oi"),
          orderId,
          productId: p.product.id,
          variantId: p.variant?.id ?? null,
          name: p.name,
          sku: p.sku,
          image: p.image,
          quantity: p.line.quantity,
          price: fromCents(p.unitCents),
          total: fromCents(p.totalCents),
          discount: "0",
        }))
      );

      // ---- Coupon usage record (table requires a user) ---------------------
      if (appliedCouponId && user) {
        await tx.insert(couponUsages).values({
          id: generateId("cu"),
          couponId: appliedCouponId,
          userId: user.id,
          orderId,
          discountAmount: fromCents(discountCents),
        });
      }

      return {
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents,
        priced,
      };
    });

    // ---- Post-commit side effects: never fail the order because of these ----
    try {
      const admins = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ["admin", "super_admin"]));

      if (admins.length > 0) {
        const customerName =
          `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim();
        await db.insert(notifications).values(
          admins.map((admin) => ({
            id: generateId("ntf"),
            userId: admin.id,
            type: "order" as const,
            title: "Nouvelle commande",
            message: `${orderNumber} — ${customerName} — ${fromCents(
              result.totalCents
            )} DZD`,
            data: { orderId, orderNumber },
          }))
        );
      }
    } catch (err) {
      console.error("[CHECKOUT] admin notification failed", err);
    }

    const emailTo = user?.email || guestEmail || null;
    if (emailTo) {
      sendOrderConfirmationEmail(emailTo, {
        orderNumber,
        items: result.priced.map((p) => ({
          name: p.name,
          quantity: p.line.quantity,
          price: fromCents(p.unitCents),
        })),
        subtotal: fromCents(result.subtotalCents),
        shipping: fromCents(result.shippingCents),
        tax: "0.00",
        discount: fromCents(result.discountCents),
        total: fromCents(result.totalCents),
        shippingAddress: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          addressLine1: shippingAddress.addressLine1,
          city: shippingAddress.city,
          state: shippingAddress.state ?? "",
          postalCode: shippingAddress.postalCode || "",
          country: shippingAddress.country,
        },
      }).catch(console.error);
    }

    return successResponse(
      { orderId, orderNumber, total: fromCents(result.totalCents) },
      "Order placed successfully!",
      201
    );
  } catch (error) {
    if (error instanceof CheckoutError) {
      return errorResponse(error.message, error.status);
    }
    console.error("[CHECKOUT ERROR]", error);
    return errorResponse("Failed to place order.", 500);
  }
}
