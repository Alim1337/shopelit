import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    return successResponse({ success: true });
  } catch (error) {
    console.error("[NOTIFICATIONS MARK ALL READ ERROR]", error);
    return errorResponse("Failed to update notifications.", 500);
  }
}
