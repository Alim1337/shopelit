import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only these hosts may be optimized by next/image. A "**" wildcard would let
    // anyone use your server as a free image proxy / resizer.
    // If an image breaks after this change, the dev terminal prints the blocked
    // hostname: add it here.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
