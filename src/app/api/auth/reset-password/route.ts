import { NextRequest } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { resetPasswordSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth";
import { db } from "@/db";
import { passwordResetTokens, sessions, users } from "@/db/schema";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const ip = getIpAddress(req);
    const { success } = rateLimit(`reset-password:${ip}`, 10, 10 * 60 * 1000);
    if (!success) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    const body = await req.json().catch(() => null);
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { token, password } = result.data;
    const passwordHash = await hashPassword(password);

    const ok = await db.transaction(async (tx) => {
      // Claim the token atomically so two requests can't both use it
      const [claimed] = await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.token, token),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date())
          )
        )
        .returning({ userId: passwordResetTokens.userId });

      if (!claimed) return false;

      // Receiving the reset email also proves the user controls the mailbox
      await tx
        .update(users)
        .set({ passwordHash, emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, claimed.userId));

      // Log out every existing session (e.g. an attacker's), and retire any
      // other reset links issued for this account
      await tx.delete(sessions).where(eq(sessions.userId, claimed.userId));
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.userId, claimed.userId),
            isNull(passwordResetTokens.usedAt)
          )
        );

      return true;
    });

    if (!ok) {
      return errorResponse("Invalid or expired reset link.", 400);
    }

    return successResponse(null, "Password reset successfully. You can now log in.");
  } catch (error) {
    console.error("[RESET PASSWORD ERROR]", error);
    return errorResponse("Failed to reset password.", 500);
  }
}
