import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users, sessions, oauthAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateId, generateToken } from "./utils";
import type { SessionUser, UserRole } from "@/types";

// No hard-coded fallback: a known default secret lets anyone forge tokens.
// In production the secret must be set (32+ random chars); in development a
// random per-process secret is used, so tokens simply expire on restart.
let devJwtSecret: string | null = null;
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const usable = !!secret && secret.length >= 32 && !secret.startsWith("your-");
  if (usable) return secret as string;

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set to a random string of at least 32 characters.");
  }
  if (!devJwtSecret) devJwtSecret = generateToken(48);
  return devJwtSecret;
}
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// ============================================================
// PASSWORD HASHING
// ============================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================
// JWT TOKENS
// ============================================================

export function signToken(
  payload: Record<string, unknown>,
  expiresIn: string = "7d"
): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken<T = Record<string, unknown>>(
  token: string
): T | null {
  try {
    return jwt.verify(token, getJwtSecret()) as T;
  } catch {
    return null;
  }
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = generateToken(64);
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    id: generateId("sess"),
    userId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return token;
}

export async function getSession(
  token: string
): Promise<SessionUser | null> {
  if (!token) return null;

  const result = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      role: users.role,
      emailVerified: users.emailVerified,
      isActive: users.isActive,
      isBanned: users.isBanned,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (!result[0]) return null;

  const session = result[0];

  // Check expiry
  if (new Date() > session.expiresAt) {
    await db.delete(sessions).where(eq(sessions.token, token));
    return null;
  }

  // Check user status
  if (!session.isActive || session.isBanned) return null;

  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    avatar: session.avatar,
    role: session.role as UserRole,
    emailVerified: session.emailVerified,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.token, token));
}

export async function deleteUserSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

// ============================================================
// USER OPERATIONS
// ============================================================

export async function getUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createUser(data: {
  email: string;
  password?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  emailVerified?: boolean;
  avatar?: string;
}) {
  const passwordHash = data.password
    ? await hashPassword(data.password)
    : null;

  const userId = generateId("usr");

  await db.insert(users).values({
    id: userId,
    email: data.email.toLowerCase(),
    name: data.name ?? null,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    passwordHash,
    role: data.role ?? "customer",
    emailVerified: data.emailVerified ?? false,
    avatar: data.avatar ?? null,
    isActive: true,
    isBanned: false,
  });

  return getUserById(userId);
}

export async function updateUserLastLogin(userId: string): Promise<void> {
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

// ============================================================
// OAUTH
// ============================================================

export async function findOrCreateOAuthUser(data: {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string;
  avatar?: string;
}) {
  // Check if oauth account exists
  const oauthResult = await db
    .select()
    .from(oauthAccounts)
    .where(
      and(
        eq(oauthAccounts.provider, data.provider),
        eq(oauthAccounts.providerAccountId, data.providerAccountId)
      )
    )
    .limit(1);

  if (oauthResult[0]) {
    const user = await getUserById(oauthResult[0].userId);
    return user;
  }

  // Check if user with email exists
  let user = await getUserByEmail(data.email);

  if (!user) {
    user = await createUser({
      email: data.email,
      name: data.name,
      avatar: data.avatar,
      emailVerified: true,
    });
  }

  if (!user) throw new Error("Failed to create user");

  // Create oauth account link
  await db.insert(oauthAccounts).values({
    id: generateId("oauth"),
    userId: user.id,
    provider: data.provider,
    providerAccountId: data.providerAccountId,
  });

  return user;
}

// ============================================================
// ROLE CHECKS
// ============================================================

export function isAdmin(role: UserRole): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    customer: 0,
    admin: 1,
    super_admin: 2,
  };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
