import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/api";
import { addressSchema } from "@/lib/validations";

async function getOwnedAddress(userId: string, id: string) {
  const result = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, userId)))
    .limit(1);
  return result[0] || null;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    const existing = await getOwnedAddress(user.id, id);
    if (!existing) return notFoundResponse("Address");

    const body = await req.json();
    const result = addressSchema.partial().safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);
    const data = result.data;

    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, user.id), eq(addresses.isDefault, true)));
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.type !== undefined) updates.type = data.type;
    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.company !== undefined) updates.company = data.company || null;
    if (data.addressLine1 !== undefined) updates.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined) updates.addressLine2 = data.addressLine2 || null;
    if (data.city !== undefined) updates.city = data.city;
    if (data.state !== undefined) updates.state = data.state || null;
    if (data.postalCode !== undefined) updates.postalCode = data.postalCode || "";
    if (data.country !== undefined) updates.country = data.country;
    if (data.phone !== undefined) updates.phone = data.phone || null;
    if (data.isDefault !== undefined) updates.isDefault = data.isDefault;

    await db.update(addresses).set(updates).where(eq(addresses.id, id));

    const updated = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return successResponse(updated[0], "Address updated successfully");
  } catch (error) {
    console.error("[ADDRESS PATCH ERROR]", error);
    return errorResponse("Failed to update address.", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await context.params;
    const existing = await getOwnedAddress(user.id, id);
    if (!existing) return notFoundResponse("Address");

    await db.delete(addresses).where(eq(addresses.id, id));

    // Promote the most recently updated remaining address to default,
    // if the one we just deleted was the default.
    if (existing.isDefault) {
      const remaining = await db
        .select({ id: addresses.id })
        .from(addresses)
        .where(eq(addresses.userId, user.id))
        .orderBy(addresses.updatedAt)
        .limit(1);
      if (remaining[0]) {
        await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, remaining[0].id));
      }
    }

    return successResponse(null, "Address deleted successfully");
  } catch (error) {
    console.error("[ADDRESS DELETE ERROR]", error);
    return errorResponse("Failed to delete address.", 500);
  }
}
