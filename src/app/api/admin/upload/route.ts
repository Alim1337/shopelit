import { NextRequest } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/session";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (user.role !== "admin" && user.role !== "super_admin") return forbiddenResponse();

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return errorResponse(
        "Image hosting isn't configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
        500
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return errorResponse("No file provided.", 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse("Unsupported file type. Use JPEG, PNG, WebP, or GIF.", 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File is too large. Maximum size is 5MB.", 400);
    }

    // Sign the upload request server-side so the API secret never reaches the browser.
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "shopelite/products";
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp.toString());
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadForm,
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok) {
      console.error("[CLOUDINARY UPLOAD ERROR]", uploadData);
      return errorResponse(uploadData?.error?.message || "Image upload failed.", 502);
    }

    return successResponse({
      url: uploadData.secure_url as string,
      publicId: uploadData.public_id as string,
      width: uploadData.width as number,
      height: uploadData.height as number,
    });
  } catch (error) {
    console.error("[UPLOAD ERROR]", error);
    return errorResponse("Failed to upload image.", 500);
  }
}
