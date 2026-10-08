import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api";

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    const existing = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      .limit(1);

    if (!existing[0]) return notFoundResponse("Notification");

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error("[NOTIFICATION PATCH ERROR]", error);
    return errorResponse("Failed to update notification.", 500);
  }
}
