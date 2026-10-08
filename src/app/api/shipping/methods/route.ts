import { NextRequest } from "next/server";
import { db } from "@/db";
import { shippingMethods, shippingZones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const methods = await db
      .select({
        id: shippingMethods.id,
        name: shippingMethods.name,
        description: shippingMethods.description,
        type: shippingMethods.type,
        price: shippingMethods.price,
        freeShippingThreshold: shippingMethods.freeShippingThreshold,
        estimatedDays: shippingMethods.estimatedDays,
        zoneName: shippingZones.name,
      })
      .from(shippingMethods)
      .innerJoin(shippingZones, eq(shippingMethods.zoneId, shippingZones.id))
      .where(eq(shippingMethods.isActive, true));

    return successResponse(methods);
  } catch (error) {
    console.error("[SHIPPING METHODS ERROR]", error);
    return errorResponse("Failed to fetch shipping methods.", 500);
  }
}
