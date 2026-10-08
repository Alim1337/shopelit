import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types";

// ============================================================
// API RESPONSE HELPERS
// ============================================================

export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, message }, { status });
}

export function errorResponse(
  error: string,
  status: number = 400
): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

export function unauthorizedResponse(): NextResponse<ApiResponse> {
  return errorResponse("Unauthorized", 401);
}

export function forbiddenResponse(): NextResponse<ApiResponse> {
  return errorResponse("Forbidden", 403);
}

export function notFoundResponse(resource: string = "Resource"): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404);
}

export function validationErrorResponse(
  error: ZodError
): NextResponse<ApiResponse> {
  const issues = error.issues ?? [];
  const messages = issues.map((e: { message: string }) => e.message).join(", ");
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      message: messages,
      details: issues,
    },
    { status: 422 }
  );
}

// ============================================================
// API ROUTE WRAPPER
// ============================================================

type RouteHandler = (
  req: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error);
      }

      if (error instanceof Error) {
        if (error.message === "UNAUTHORIZED") return unauthorizedResponse();
        if (error.message === "FORBIDDEN") return forbiddenResponse();
        if (error.message === "NOT_FOUND") return notFoundResponse();
        console.error("[API Error]:", error.message, error.stack);
        return errorResponse(
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
          500
        );
      }

      console.error("[API Error] Unknown:", error);
      return errorResponse("Internal server error", 500);
    }
  };
}

// ============================================================
// PAGINATION HELPER
// ============================================================

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}

// ============================================================
// RATE LIMITING (Simple in-memory implementation)
// ============================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_TRACKED_KEYS = 15000;
let lastSweep = 0;

// Drop expired entries so the map can't grow forever
function sweepRateLimitMap(now: number) {
  if (now - lastSweep < 60_000 && rateLimitMap.size < MAX_TRACKED_KEYS) return;
  lastSweep = now;
  for (const [key, value] of rateLimitMap) {
    if (value.resetTime < now) rateLimitMap.delete(key);
  }
  // Hard cap: evict the oldest entries (Map keeps insertion order)
  for (const key of rateLimitMap.keys()) {
    if (rateLimitMap.size <= MAX_TRACKED_KEYS) break;
    rateLimitMap.delete(key);
  }
}

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  sweepRateLimitMap(now);
  const key = identifier;

  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetTime < now) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  existing.count++;
  rateLimitMap.set(key, existing);
  return { success: true, remaining: maxRequests - existing.count };
}

// ============================================================
// REQUEST HELPERS
// ============================================================

// The first X-Forwarded-For entry is written by the CLIENT, so trusting it lets
// anyone dodge every rate limit by sending a random value. Prefer headers set
// by the hosting platform, and otherwise use the LAST entry, which is the one
// appended by the closest proxy.
//   Cloudflare: cf-connecting-ip   Netlify: x-nf-client-connection-ip
//   Vercel / most proxies: x-forwarded-for   Self-hosted nginx: set x-real-ip
export function getIpAddress(req: NextRequest): string {
  const h = req.headers;
  const platformIp =
    h.get("cf-connecting-ip") ||
    h.get("x-nf-client-connection-ip") ||
    h.get("x-real-ip");
  if (platformIp) return platformIp.trim();

  const forwarded = h
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return forwarded?.length ? forwarded[forwarded.length - 1] : "unknown";
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent") || "unknown";
}
