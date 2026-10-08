import { NextRequest } from "next/server";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  rateLimit,
  getIpAddress,
} from "@/lib/api";
import { sendContactEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest) {
  try {
    const { success } = rateLimit(`contact:${getIpAddress(req)}`, 5, 10 * 60 * 1000);
    if (!success) {
      return errorResponse("Too many messages. Please try again later.", 429);
    }

    const body = await req.json();
    const result = contactSchema.safeParse(body);
    if (!result.success) return validationErrorResponse(result.error);

    await sendContactEmail(result.data);

    return successResponse({ success: true }, "Your message has been sent. We'll get back to you soon.");
  } catch (error) {
    console.error("[CONTACT ERROR]", error);
    return errorResponse("Failed to send your message. Please try again.", 500);
  }
}
