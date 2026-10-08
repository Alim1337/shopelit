import { Store, Handshake, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const REASONS = [
  { icon: Store, title: "Reach New Customers", text: "Get your products in front of shoppers actively looking to buy." },
  { icon: TrendingUp, title: "Grow Your Business", text: "Access analytics and tools designed to help you scale." },
  { icon: Handshake, title: "Fair Partnership", text: "Transparent fees, reliable payouts, and real support." },
];

export default function PartnersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
          Partners
        </span>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-4">Sell on ShopElite</h1>
        <p className="text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
          Join our network of brands and merchants and reach thousands of engaged shoppers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-14">
        {REASONS.map((r) => (
          <div key={r.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 text-center">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mx-auto mb-4">
              <r.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">{r.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <Link href="/contact">
          <Button size="lg">Apply to Become a Partner</Button>
        </Link>
      </div>
    </div>
  );
}
