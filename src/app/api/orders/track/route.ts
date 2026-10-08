import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    // Stops people from guessing order number + email pairs
    const { success } = rateLimit(`track:${getIpAddress(req)}`, 10, 10 * 60 * 1000);
    if (!success) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!orderNumber || !email) {
      return errorResponse("Order number and email are required.", 400);
    }

    const result = await db
      .select({
        order: orders,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.orderNumber, orderNumber.toUpperCase()))
      .limit(1);

    const match = result[0];
    if (!match) return notFoundResponse("Order");

    const ownerEmail = (match.userEmail || match.order.guestEmail || "").toLowerCase();
    if (ownerEmail !== email) {
      // Don't reveal whether the order exists if the email doesn't match.
      return notFoundResponse("Order");
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, match.order.id));

    return successResponse({ ...match.order, items });
  } catch (error) {
    console.error("[ORDER TRACK ERROR]", error);
    return errorResponse("Failed to look up order.", 500);
  }
}
