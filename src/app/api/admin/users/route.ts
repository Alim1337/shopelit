import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { desc, sql, like } from "drizzle-orm";
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
    const search = searchParams.get("search");

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);

    const userList = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        isBanned: users.isBanned,
        emailVerified: users.emailVerified,
        avatar: users.avatar,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return successResponse(buildPaginatedResponse(userList, count, page, limit));
  } catch (error) {
    console.error("[ADMIN USERS GET ERROR]", error);
    return errorResponse("Failed to fetch users.", 500);
  }
}
