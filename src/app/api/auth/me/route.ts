import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { successResponse, unauthorizedResponse, validationErrorResponse, errorResponse } from "@/lib/api";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    return successResponse({ user });
  } catch {
    return unauthorizedResponse();
  }
}

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const { firstName, lastName, phone } = result.data;
    const name =
      firstName || lastName
        ? `${firstName ?? ""} ${lastName ?? ""}`.trim()
        : undefined;

    await db
      .update(users)
      .set({
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(name && { name }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return successResponse({ success: true }, "Profile updated successfully");
  } catch (error) {
    console.error("[PROFILE UPDATE ERROR]", error);
    return errorResponse("Failed to update profile.", 500);
  }
}
