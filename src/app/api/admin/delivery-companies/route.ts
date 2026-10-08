import { NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/db";
import { shippingMethods, shippingZones } from "@/db/schema";
import { eq } from "drizzle-orm";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from "@/lib/api";
import { generateId } from "@/lib/utils";

const DEFAULT_ZONE_NAME = "Algérie";

/**
 * Delivery companies are stored as shipping methods under a single
 * default zone. This keeps the underlying checkout/orders plumbing
 * (which already understands shippingMethodId) while giving the admin
 * a simple flat list of companies with no zone concept to manage.
 */
async function getOrCreateDefaultZone(): Promise<string> {
  const existing = await db.select().from(shippingZones).where(eq(shippingZones.name, DEFAULT_ZONE_NAME)).limit(1);
  if (existing[0]) return existing[0].id;

  const id = generateId("shz");
  await db.insert(shippingZones).values({
    id,
    name: DEFAULT_ZONE_NAME,
    countries: ["DZ"],
    states: [],
    isActive: true,
  });
  return id;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const list = await db
      .select({
        id: shippingMethods.id,
        name: shippingMethods.name,
        description: shippingMethods.description,
        price: shippingMethods.price,
        estimatedDays: shippingMethods.estimatedDays,
        isActive: shippingMethods.isActive,
      })
      .from(shippingMethods)
      .orderBy(shippingMethods.name);

    return successResponse(list);
  } catch (error) {
    console.error("[ADMIN DELIVERY COMPANIES GET ERROR]", error);
    return errorResponse("Failed to fetch delivery companies.", 500);
  }
}

const companySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  estimatedDays: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const body = await req.json();
    const result = companySchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    const data = result.data;
    const zoneId = await getOrCreateDefaultZone();
    const id = generateId("shm");

    await db.insert(shippingMethods).values({
      id,
      zoneId,
      name: data.name,
      description: data.description || null,
      type: "flat_rate",
      price: data.price.toFixed(2),
      estimatedDays: data.estimatedDays ?? null,
      isActive: data.isActive ?? true,
    });

    const created = await db.select().from(shippingMethods).where(eq(shippingMethods.id, id)).limit(1);
    return successResponse(created[0], "Delivery company added successfully", 201);
  } catch (error) {
    console.error("[ADMIN DELIVERY COMPANIES POST ERROR]", error);
    return errorResponse("Failed to add delivery company.", 500);
  }
}
