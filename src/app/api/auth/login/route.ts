import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { loginSchema } from "@/lib/validations";
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  updateUserLastLogin,
} from "@/lib/auth";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const ip = getIpAddress(req);
    const { success } = rateLimit(`login:${ip}`, 10, 60000);
    if (!success) {
      return errorResponse("Too many login attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { email, password, rememberMe } = result.data;

    const user = await getUserByEmail(email);

    if (!user || !user.passwordHash) {
      return errorResponse("Invalid email or password.", 401);
    }

    if (!user.isActive) {
      return errorResponse("Your account has been deactivated.", 403);
    }

    if (user.isBanned) {
      return errorResponse("Your account has been suspended.", 403);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return errorResponse("Invalid email or password.", 401);
    }

    // Create session
    const sessionToken = await createSession(
      user.id,
      ip,
      req.headers.get("user-agent") ?? undefined
    );

    // Update last login
    await updateUserLastLogin(user.id);

    // Set cookie
    const cookieStore = await cookies();
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
    });

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return errorResponse("Login failed. Please try again.", 500);
  }
}
