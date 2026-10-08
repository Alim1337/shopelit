import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { orders, users } from "@/db/schema";
import { eq, desc, sql, like, or, and, type SQL } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  getPagination,
  buildPaginatedResponse,
} from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = getPagination(searchParams);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const shippingMethodId = searchParams.get("shippingMethodId");

    const conditions: SQL[] = [];
    if (status) {
      conditions.push(
        eq(
          orders.status,
          status as
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled"
            | "refunded"
            | "partially_refunded"
        )
      );
    }
    if (shippingMethodId) {
      conditions.push(eq(orders.shippingMethodId, shippingMethodId));
    }
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.guestEmail, `%${search}%`)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(whereClause);

    const orderList = await db
      .select({
        order: orders,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const formatted = orderList.map(({ order, user: u }) => ({
      ...order,
      user: u,
    }));

    return successResponse(buildPaginatedResponse(formatted, count, page, limit));
  } catch (error) {
    console.error("[ADMIN ORDERS GET ERROR]", error);
    return errorResponse("Failed to fetch orders.", 500);
  }
}
