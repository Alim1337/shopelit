import { NextRequest } from "next/server";
import { db } from "@/db";
import { orders, users, products, reviews } from "@/db/schema";
import { eq, gte, sql, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/session";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") {
      return forbiddenResponse();
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period stats
    const [totalRevenueResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(total), 0)::text` })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, thirtyDaysAgo)
        )
      );

    const [prevRevenueResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(total), 0)::text` })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, sixtyDaysAgo),
          sql`${orders.createdAt} < ${thirtyDaysAgo}`
        )
      );

    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo));

    const [prevOrdersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, sixtyDaysAgo),
          sql`${orders.createdAt} < ${thirtyDaysAgo}`
        )
      );

    const [totalCustomersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(eq(users.role, "customer"), gte(users.createdAt, thirtyDaysAgo))
      );

    const [prevCustomersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(
        and(
          eq(users.role, "customer"),
          gte(users.createdAt, sixtyDaysAgo),
          sql`${users.createdAt} < ${thirtyDaysAgo}`
        )
      );

    const [totalProductsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.status, "active"));

    // Revenue chart data (last 30 days)
    const revenueData = await db
      .select({
        date: sql<string>`DATE(created_at)::text`,
        revenue: sql<string>`COALESCE(SUM(total), 0)::text`,
        orders: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`DATE(created_at)`)
      .orderBy(sql`DATE(created_at)`);

    // Top products
    const topProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        thumbnail: products.thumbnail,
        soldCount: products.soldCount,
        revenue: sql<string>`(${products.price} * ${products.soldCount})::text`,
      })
      .from(products)
      .where(eq(products.status, "active"))
      .orderBy(sql`${products.soldCount} DESC`)
      .limit(5);

    // Recent orders
    const recentOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        total: orders.total,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(5);

    // Low stock products
    const lowStockProducts = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        thumbnail: products.thumbnail,
        stock: products.stock,
        lowStockThreshold: products.lowStockThreshold,
      })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          sql`${products.stock} <= ${products.lowStockThreshold}`
        )
      )
      .orderBy(products.stock)
      .limit(5);

    // Order status breakdown (last 30 days)
    const orderStatusBreakdown = await db
      .select({
        status: orders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(orders)
      .where(gte(orders.createdAt, thirtyDaysAgo))
      .groupBy(orders.status);

    // Calculate growth percentages
    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const currentRevenue = parseFloat(totalRevenueResult.total);
    const prevRevenue = parseFloat(prevRevenueResult.total);

    return successResponse({
      stats: {
        totalRevenue: currentRevenue,
        totalOrders: totalOrdersResult.count,
        totalCustomers: totalCustomersResult.count,
        totalProducts: totalProductsResult.count,
        revenueGrowth: calcGrowth(currentRevenue, prevRevenue),
        ordersGrowth: calcGrowth(totalOrdersResult.count, prevOrdersResult.count),
        customersGrowth: calcGrowth(totalCustomersResult.count, prevCustomersResult.count),
        productsGrowth: 0,
      },
      revenueData: revenueData.map((d) => ({
        date: d.date,
        revenue: parseFloat(d.revenue),
        orders: d.orders,
      })),
      topProducts,
      recentOrders,
      lowStockProducts,
      orderStatusBreakdown,
    });
  } catch (error) {
    console.error("[ADMIN STATS ERROR]", error);
    return errorResponse("Failed to fetch stats.", 500);
  }
}
