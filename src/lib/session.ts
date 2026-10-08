import { cookies } from "next/headers";
import { getSession } from "./auth";
import type { SessionUser } from "@/types";

export const SESSION_COOKIE = "shop_session";

// ============================================================
// SERVER-SIDE SESSION HELPERS (for Server Components & API Routes)
// ============================================================

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return getSession(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "super_admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
