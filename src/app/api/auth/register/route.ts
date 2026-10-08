import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { registerSchema } from "@/lib/validations";
import {
  createUser,
  getUserByEmail,
  createSession,
  hashPassword,
} from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";
import { sendWelcomeEmail, sendEmailVerification } from "@/lib/email";
import { db } from "@/db";
import { emailVerificationTokens } from "@/db/schema";
import { generateId, generateToken } from "@/lib/utils";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    // Rate limit
    const ip = getIpAddress(req);
    const { success } = rateLimit(`register:${ip}`, 5, 60000);
    if (!success) {
      return errorResponse("Too many requests. Please try again later.", 429);
    }

    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { email, password, firstName, lastName } = result.data;

    // Check if email already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return errorResponse("An account with this email already exists.", 409);
    }

    // Create user
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
    });

    if (!user) {
      return errorResponse("Failed to create account. Please try again.", 500);
    }

    // Create email verification token
    const verificationToken = generateToken(64);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerificationTokens).values({
      id: generateId("evt"),
      userId: user.id,
      token: verificationToken,
      expiresAt,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/auth/verify-email?token=${verificationToken}`;

    // Send emails (non-blocking)
    sendWelcomeEmail(user.email, user.name || firstName).catch(console.error);
    sendEmailVerification(
      user.email,
      user.name || firstName,
      verificationUrl
    ).catch(console.error);

    // Create session
    const sessionToken = await createSession(
      user.id,
      getIpAddress(req),
      req.headers.get("user-agent") ?? undefined
    );

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
      "Account created successfully!",
      201
    );
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return errorResponse("Failed to create account.", 500);
  }
}
