import { NextRequest } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { forgotPasswordSchema } from "@/lib/validations";
import { getUserByEmail } from "@/lib/auth";
import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { generateId, generateToken } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/email";
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
    const { success } = rateLimit(`forgot-password:${ip}`, 3, 300000); // 3 per 5 min
    if (!success) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { email } = result.data;

    // Always return success to prevent email enumeration
    const user = await getUserByEmail(email);

    if (user && user.isActive) {
      const token = generateToken(64);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokens).values({
        id: generateId("prt"),
        userId: user.id,
        token,
        expiresAt,
      });

      const appUrl = getAppUrl();
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

      sendPasswordResetEmail(
        user.email,
        user.name || user.email,
        resetUrl
      ).catch(console.error);
    }

    return successResponse(
      null,
      "If an account with that email exists, we sent a password reset link."
    );
  } catch (error) {
    console.error("[FORGOT PASSWORD ERROR]", error);
    return errorResponse("Failed to process request.", 500);
  }
}
