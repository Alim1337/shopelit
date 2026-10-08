import { NextRequest } from "next/server";
import { newsletterSchema } from "@/lib/validations";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";
import { generateId } from "@/lib/utils";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { success } = rateLimit(`newsletter:${getIpAddress(req)}`, 5, 10 * 60 * 1000);
    if (!success) {
      return errorResponse("Too many attempts. Please try again later.", 429);
    }

    const body = await req.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      return validationErrorResponse(result.error);
    }

    const { email, name } = result.data;

    // Check if already subscribed
    const existing = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email.toLowerCase()))
      .limit(1);

    if (existing[0]) {
      if (!existing[0].isActive) {
        // Re-subscribe
        await db
          .update(newsletterSubscribers)
          .set({ isActive: true, unsubscribedAt: null })
          .where(eq(newsletterSubscribers.id, existing[0].id));
        return successResponse(null, "Welcome back! You've been re-subscribed.");
      }
      return successResponse(null, "You're already subscribed!");
    }

    await db.insert(newsletterSubscribers).values({
      id: generateId("nl"),
      email: email.toLowerCase(),
      name: name ?? null,
      isActive: true,
    });

    sendNewsletterWelcomeEmail(email, name).catch(console.error);

    return successResponse(null, "Successfully subscribed to our newsletter!", 201);
  } catch (error) {
    console.error("[NEWSLETTER ERROR]", error);
    return errorResponse("Failed to subscribe.", 500);
  }
}
