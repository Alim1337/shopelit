import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaGithub,
} from "react-icons/fa";

const FOOTER_LINKS = {
  shop: [
    { href: "/products", label: "All Products" },
    { href: "/products?isFeatured=true", label: "Featured" },
    { href: "/products?isNewArrival=true", label: "New Arrivals" },
    { href: "/products?isOnSale=true", label: "Sale" },
    { href: "/categories", label: "Categories" },
    { href: "/brands", label: "Brands" },
  ],
  support: [
    { href: "/help", label: "Help Center" },
    { href: "/track-order", label: "Track Order" },
    { href: "/help/shipping", label: "Shipping Info" },
    { href: "/help/returns", label: "Returns & Refunds" },
    { href: "/help/size-guide", label: "Size Guide" },
    { href: "/contact", label: "Contact Us" },
    { href: "/blog", label: "Blog" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press" },
    { href: "/partners", label: "Partners" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
  account: [
    { href: "/account", label: "My Account" },
    { href: "/account/orders", label: "Order History" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/auth/login", label: "Sign In" },
    { href: "/auth/register", label: "Create Account" },
  ],
};

const SOCIAL_LINKS = [
  { href: "https://facebook.com", icon: FaFacebook, label: "Facebook" },
  { href: "https://twitter.com", icon: FaTwitter, label: "Twitter" },
  { href: "https://instagram.com", icon: FaInstagram, label: "Instagram" },
  { href: "https://youtube.com", icon: FaYoutube, label: "YouTube" },
  { href: "https://github.com", icon: FaGithub, label: "GitHub" },
];

const PAYMENT_METHODS = [
  { name: "Visa", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" },
  { name: "Mastercard", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" },
  { name: "Apple Pay", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Apple_Pay_logo.svg/200px-Apple_Pay_logo.svg.png" },
  { name: "Google Pay", src: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/200px-Google_Pay_Logo.svg.png" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold text-white">ShopElite</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 mb-6">
              Your premier destination for premium products. Discover thousands of items from top brands worldwide.
            </p>
            <div className="space-y-2 text-sm text-slate-400">
              <a href="mailto:contact@shopelite.dz" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                contact@shopelite.dz
              </a>
              <a href="tel:+213555000000" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                +213 555 000 000
              </a>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>Alger, Algérie</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Shop</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Account</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} ShopElite. All rights reserved.
            </p>

            {/* Payment Method */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Paiement :</span>
              <div className="h-6 px-2.5 rounded bg-slate-700 flex items-center">
                <span className="text-xs text-slate-300 font-medium">Cash à la livraison</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
