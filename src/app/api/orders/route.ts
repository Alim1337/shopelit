import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  getPagination,
  buildPaginatedResponse,
} from "@/lib/api";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPagination(searchParams);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.userId, user.id));

    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orderList.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );

    return successResponse(
      buildPaginatedResponse(ordersWithItems, count, page, limit)
    );
  } catch (error) {
    console.error("[ORDERS GET ERROR]", error);
    return errorResponse("Failed to fetch orders.", 500);
  }
}
