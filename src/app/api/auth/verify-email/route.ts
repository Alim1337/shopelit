import { NextRequest } from "next/server";
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";

const verifyEmailSchema = z.object({
  token: z.string().min(20).max(200),
});

// POST (not GET) on purpose: mail scanners and link prefetchers open links
// from emails, and a GET would let them consume the token before the user does.
export async function POST(req: NextRequest) {
  try {
    const ip = getIpAddress(req);
    const { success } = rateLimit(`verify-email:${ip}`, 10, 60000);
    if (!success) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    const body = await req.json().catch(() => null);
    const result = verifyEmailSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const verified = await db.transaction(async (tx) => {
      // Claim the token atomically so it can only be used once
      const [claimed] = await tx
        .update(emailVerificationTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(emailVerificationTokens.token, result.data.token),
            isNull(emailVerificationTokens.usedAt),
            gt(emailVerificationTokens.expiresAt, new Date())
          )
        )
        .returning({ userId: emailVerificationTokens.userId });

      if (!claimed) return false;

      await tx
        .update(users)
        .set({ emailVerified: true, updatedAt: new Date() })
        .where(eq(users.id, claimed.userId));

      return true;
    });

    if (!verified) {
      return errorResponse(
        "This verification link is invalid, expired or already used.",
        400
      );
    }

    return successResponse(null, "Your email has been verified.");
  } catch (error) {
    console.error("[VERIFY EMAIL ERROR]", error);
    return errorResponse("Failed to verify email.", 500);
  }
}
