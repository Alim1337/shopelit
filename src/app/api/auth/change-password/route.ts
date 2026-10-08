import { NextRequest } from "next/server";
import { changePasswordSchema } from "@/lib/validations";
import { getCurrentUser } from "@/lib/session";
import { getUserById, verifyPassword, hashPassword, deleteUserSessions, createSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse, getIpAddress } from "@/lib/api";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) return unauthorizedResponse();

    const body = await req.json();
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const { currentPassword, newPassword } = result.data;

    const user = await getUserById(sessionUser.id);
    if (!user || !user.passwordHash) {
      return errorResponse("Unable to update password for this account.", 400);
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse("Current password is incorrect.", 401);
    }

    const newHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id));

    // Invalidate all sessions and start a fresh one for this device
    await deleteUserSessions(user.id);
    const token = await createSession(user.id, getIpAddress(req), req.headers.get("user-agent") ?? undefined);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return successResponse({ success: true }, "Password updated successfully");
  } catch (error) {
    console.error("[CHANGE PASSWORD ERROR]", error);
    return errorResponse("Failed to update password.", 500);
  }
}
