import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/api";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;

    const orderResult = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, id),
          eq(orders.userId, user.id)
        )
      )
      .limit(1);

    if (!orderResult[0]) return notFoundResponse("Order");

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));

    return successResponse({ ...orderResult[0], items });
  } catch (error) {
    console.error("[ORDER GET ERROR]", error);
    return errorResponse("Failed to fetch order.", 500);
  }
}
