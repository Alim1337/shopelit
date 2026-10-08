import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "@/lib/api";
import { generateId } from "@/lib/utils";
import { addressSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const list = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id))
      .orderBy(desc(addresses.isDefault), desc(addresses.updatedAt));

    return successResponse(list);
  } catch (error) {
    console.error("[ADDRESSES GET ERROR]", error);
    return errorResponse("Failed to fetch addresses.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const result = addressSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);
    const data = result.data;

    // If this is the user's first address, or explicitly marked default,
    // make sure it becomes the (only) default.
    const existingCount = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    const shouldBeDefault = data.isDefault || existingCount.length === 0;

    if (shouldBeDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(and(eq(addresses.userId, user.id), eq(addresses.isDefault, true)));
    }

    const id = generateId("addr");
    await db.insert(addresses).values({
      id,
      userId: user.id,
      type: data.type || "both",
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company || null,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode || "",
      country: data.country,
      phone: data.phone || null,
      isDefault: shouldBeDefault,
    });

    const created = await db.select().from(addresses).where(eq(addresses.id, id)).limit(1);
    return successResponse(created[0], "Address saved successfully");
  } catch (error) {
    console.error("[ADDRESSES POST ERROR]", error);
    return errorResponse("Failed to save address.", 500);
  }
}
