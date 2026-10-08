import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import {
  orders,
  orderItems,
  users,
  products,
  productVariants,
  inventoryHistory,
} from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";
import { sendOrderConfirmedByPhoneEmail, sendShippingUpdateEmail } from "@/lib/email";
import { formatDate, generateId } from "@/lib/utils";

const updateOrderSchema = z.object({
  status: z
    .enum([
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
      "partially_refunded",
    ])
    .optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded", "partially_refunded"]).optional(),
  trackingNumber: z.string().max(200).optional(),
  trackingUrl: z.string().url().optional().or(z.literal("")),
});

// ------------------------------------------------------------
// Stock sync when an order is cancelled / re-opened
// Uses inventory_history as the source of truth, so it is
// idempotent and never touches orders created before stock
// tracking existed (they have no "sale" rows).
// ------------------------------------------------------------
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

class StockError extends Error {}

const lineKey = (productId: string, variantId: string | null) =>
  `${productId}:${variantId ?? ""}`;

async function syncStockForStatusChange(
  tx: Tx,
  order: { id: string; orderNumber: string },
  previousStatus: string,
  newStatus: string,
  adminId: string
) {
  const cancelling = newStatus === "cancelled" && previousStatus !== "cancelled";
  const reopening = previousStatus === "cancelled" && newStatus !== "cancelled";
  if (!cancelling && !reopening) return;

  const history = await tx
    .select()
    .from(inventoryHistory)
    .where(eq(inventoryHistory.orderId, order.id));

  // net: every movement for the order; restored: only cancel/reopen movements
  const net = new Map<string, number>();
  const restored = new Map<string, number>();
  for (const h of history) {
    const key = lineKey(h.productId, h.variantId);
    net.set(key, (net.get(key) ?? 0) + h.quantity);
    if (h.type === "order_cancelled" || h.type === "order_reopened") {
      restored.set(key, (restored.get(key) ?? 0) + h.quantity);
    }
  }

  const items = await tx
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const done = new Set<string>();
  for (const item of items) {
    if (!item.productId) continue;
    const key = lineKey(item.productId, item.variantId);
    if (done.has(key)) continue;
    done.add(key);

    // delta > 0 puts stock back, delta < 0 takes it out again
    const delta = cancelling
      ? Math.max(0, -(net.get(key) ?? 0))
      : -Math.max(0, restored.get(key) ?? 0);
    if (delta === 0) continue;

    const [product] = await tx
      .select({ allowBackorder: products.allowBackorder })
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);
    if (!product) continue;

    let newStock: number;

    if (item.variantId) {
      const updated = await tx
        .update(productVariants)
        .set({ stock: sql`${productVariants.stock} + ${delta}` })
        .where(
          and(
            eq(productVariants.id, item.variantId),
            delta < 0 && !product.allowBackorder
              ? gte(productVariants.stock, -delta)
              : undefined
          )
        )
        .returning({ stock: productVariants.stock });
      if (!updated.length) {
        throw new StockError(`Cannot re-open this order: "${item.name}" is out of stock.`);
      }
      newStock = updated[0].stock;

      await tx
        .update(products)
        .set({ soldCount: sql`GREATEST(${products.soldCount} - ${delta}, 0)` })
        .where(eq(products.id, item.productId));
    } else {
      const updated = await tx
        .update(products)
        .set({
          stock: sql`${products.stock} + ${delta}`,
          soldCount: sql`GREATEST(${products.soldCount} - ${delta}, 0)`,
        })
        .where(
          and(
            eq(products.id, item.productId),
            delta < 0 && !product.allowBackorder
              ? gte(products.stock, -delta)
              : undefined
          )
        )
        .returning({ stock: products.stock });
      if (!updated.length) {
        throw new StockError(`Cannot re-open this order: "${item.name}" is out of stock.`);
      }
      newStock = updated[0].stock;
    }

    await tx.insert(inventoryHistory).values({
      id: generateId("inv"),
      productId: item.productId,
      variantId: item.variantId ?? null,
      type: cancelling ? "order_cancelled" : "order_reopened",
      quantity: delta,
      previousStock: newStock - delta,
      newStock,
      reason: `Order ${order.orderNumber} ${cancelling ? "cancelled" : "re-opened"}`,
      userId: adminId,
      orderId: order.id,
    });
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const result = await db
      .select({
        order: orders,
        user: { id: users.id, name: users.name, email: users.email },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id))
      .limit(1);

    if (!result[0]) return notFoundResponse("Order");

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

    return successResponse({ ...result[0].order, user: result[0].user, items });
  } catch (error) {
    console.error("[ADMIN ORDER GET ERROR]", error);
    return errorResponse("Failed to fetch order.", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const body = await req.json();
    const result = updateOrderSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const existing = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("Order");

    const data = result.data;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status) {
      updates.status = data.status;
      if (data.status === "shipped") updates.shippedAt = new Date();
      if (data.status === "delivered") {
        updates.deliveredAt = new Date();
        // Cash on delivery: cash is collected at the moment of delivery,
        // so mark payment as collected unless the admin explicitly set
        // a different payment status in the same request.
        if (!data.paymentStatus) updates.paymentStatus = "paid";
      }
      if (data.status === "cancelled") updates.cancelledAt = new Date();
    }
    if (data.paymentStatus) updates.paymentStatus = data.paymentStatus;
    if (data.trackingNumber !== undefined) updates.trackingNumber = data.trackingNumber;
    if (data.trackingUrl !== undefined) updates.trackingUrl = data.trackingUrl;

    try {
      await db.transaction(async (tx) => {
        await tx.update(orders).set(updates).where(eq(orders.id, id));
        if (data.status && data.status !== existing[0].status) {
          await syncStockForStatusChange(
            tx,
            { id, orderNumber: existing[0].orderNumber },
            existing[0].status,
            data.status,
            user.id
          );
        }
      });
    } catch (err) {
      if (err instanceof StockError) return errorResponse(err.message, 409);
      throw err;
    }

    const updated = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    const updatedOrder = updated[0];

    // Fire transactional emails on meaningful status transitions.
    const previousStatus = existing[0].status;
    if (data.status && data.status !== previousStatus && updatedOrder) {
      void sendOrderStatusEmail(updatedOrder, previousStatus, data.status);
    }

    return successResponse(updatedOrder, "Order updated successfully");
  } catch (error) {
    console.error("[ADMIN ORDER PATCH ERROR]", error);
    return errorResponse("Failed to update order.", 500);
  }
}

async function sendOrderStatusEmail(
  order: typeof orders.$inferSelect,
  previousStatus: string,
  newStatus: string
) {
  try {
    let emailTo = order.guestEmail || null;

    if (!emailTo && order.userId) {
      const [customer] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1);
      emailTo = customer?.email || null;
    }

    if (!emailTo) return;

    if (newStatus === "confirmed" && previousStatus === "pending") {
      await sendOrderConfirmedByPhoneEmail(emailTo, {
        orderNumber: order.orderNumber,
        total: order.total,
        shippingMethodName: order.shippingMethodName || undefined,
        estimatedDelivery: order.estimatedDelivery
          ? formatDate(order.estimatedDelivery, "d MMM yyyy")
          : undefined,
      });
    } else if (newStatus === "shipped") {
      await sendShippingUpdateEmail(emailTo, {
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber || undefined,
        trackingUrl: order.trackingUrl || undefined,
        shippingMethodName: order.shippingMethodName || undefined,
        estimatedDelivery: order.estimatedDelivery
          ? formatDate(order.estimatedDelivery, "d MMM yyyy")
          : undefined,
      });
    }
  } catch (error) {
    console.error("[ORDER STATUS EMAIL ERROR]", error, { orderId: order.id, newStatus });
  }
}