import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { getAppUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  title: {
    default: "ShopElite - Premium E-Commerce",
    template: "%s | ShopElite",
  },
  description:
    "Discover premium products from top brands worldwide. Shop with confidence on ShopElite - your ultimate shopping destination.",
  keywords: [
    "e-commerce",
    "online shopping",
    "premium products",
    "fashion",
    "electronics",
    "brands",
  ],
  authors: [{ name: "ShopElite" }],
  creator: "ShopElite",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getAppUrl(),
    siteName: "ShopElite",
    title: "ShopElite - Premium E-Commerce",
    description:
      "Discover premium products from top brands worldwide. Shop with confidence.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ShopElite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopElite - Premium E-Commerce",
    description:
      "Discover premium products from top brands worldwide.",
    images: ["/images/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Apply dark mode class before React hydrates to prevent FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');})();`,
          }}
        />
        {children}
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: "12px",
              fontFamily: "inherit",
            },
          }}
        />
      </body>
    </html>
  );
}
