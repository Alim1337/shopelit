import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailVerificationTokens } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { generateId, generateToken } from "@/lib/utils";
import { sendEmailVerification } from "@/lib/email";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  rateLimit,
} from "@/lib/api";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    if (user.emailVerified) {
      return successResponse(null, "Your email is already verified.");
    }

    const { success } = rateLimit(`resend-verification:${user.id}`, 3, 10 * 60 * 1000);
    if (!success) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    // Cooldown: one email per minute, even if the in-memory limiter was reset.
    // Compared inside Postgres (created_at vs now()) so it stays correct even
    // when the database timezone differs from the app's.
    const [recent] = await db
      .select({ id: emailVerificationTokens.id })
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, user.id),
          sql`${emailVerificationTokens.createdAt} > now() - interval '60 seconds'`
        )
      )
      .limit(1);

    if (recent) {
      return errorResponse("Please wait a minute before requesting another email.", 429);
    }

    const token = generateToken(64);
    await db.transaction(async (tx) => {
      // Invalidate older unused links so only the newest one works
      await tx
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(emailVerificationTokens.userId, user.id),
            isNull(emailVerificationTokens.usedAt),
            gt(emailVerificationTokens.expiresAt, new Date())
          )
        );

      await tx.insert(emailVerificationTokens).values({
        id: generateId("evt"),
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendEmailVerification(
      user.email,
      user.name || user.email,
      `${appUrl}/auth/verify-email?token=${token}`
    );

    return successResponse(null, "Verification email sent.");
  } catch (error) {
    console.error("[RESEND VERIFICATION ERROR]", error);
    return errorResponse("Could not send the verification email.", 500);
  }
}