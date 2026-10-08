import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";

const updateUserSchema = z.object({
  role: z.enum(["customer", "admin", "super_admin"]).optional(),
  isActive: z.boolean().optional(),
  isBanned: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorizedResponse();
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") return forbiddenResponse();

    const { id } = await context.params;
    const body = await req.json();
    const result = updateUserSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    // Only super_admins can change roles to admin/super_admin
    if (result.data.role && result.data.role !== "customer" && currentUser.role !== "super_admin") {
      return forbiddenResponse();
    }

    const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!existing[0]) return notFoundResponse("User");

    await db
      .update(users)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(users.id, id));

    const updated = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const { passwordHash: _passwordHash, ...safeUser } = updated[0];

    return successResponse(safeUser, "User updated successfully");
  } catch (error) {
    console.error("[ADMIN USER PATCH ERROR]", error);
    return errorResponse("Failed to update user.", 500);
  }
}
