import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { deleteSession } from "@/lib/auth";
import { successResponse } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(_req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
      await deleteSession(token);
      cookieStore.delete(SESSION_COOKIE);
    }

    return successResponse(null, "Logged out successfully");
  } catch (error) {
    console.error("[LOGOUT ERROR]", error);
    return successResponse(null, "Logged out");
  }
}
