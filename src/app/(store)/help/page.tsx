import Link from "next/link";
import { Truck, RotateCcw, Ruler, MessageCircle, Search } from "lucide-react";

const TOPICS = [
  { href: "/track-order", icon: Search, title: "Track Your Order", text: "Check the status of an order using your order number and email." },
  { href: "/help/shipping", icon: Truck, title: "Shipping Info", text: "Delivery times, tracking, and shipping rates." },
  { href: "/help/returns", icon: RotateCcw, title: "Returns & Refunds", text: "How to return an item and get your money back." },
  { href: "/help/size-guide", icon: Ruler, title: "Size Guide", text: "Find your perfect fit across all our categories." },
  { href: "/contact", icon: MessageCircle, title: "Contact Support", text: "Can't find what you need? Talk to our team." },
];

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
          Help Center
        </span>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-4">How can we help?</h1>
        <p className="text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
          Browse common topics below, or reach out to our support team directly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {TOPICS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4">
              <t.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors mb-1.5">
              {t.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">{t.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
