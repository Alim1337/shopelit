import Link from "next/link";
import { ArrowLeft, PackageCheck, Clock, Banknote, XCircle } from "lucide-react";

const STEPS = [
  { icon: Clock, title: "Request within 30 days", text: "Returns must be requested within 30 days of delivery." },
  { icon: PackageCheck, title: "Keep it unused", text: "Items must be unworn, unwashed, and in original packaging with tags attached." },
  { icon: Banknote, title: "Remboursement", text: "Une fois le retour inspecté et validé, nous vous remboursons en espèces lors de la prochaine livraison ou via virement. Délai : 3 à 7 jours ouvrés." },
];

const NON_RETURNABLE = [
  "Gift cards",
  "Final sale or clearance items",
  "Personal care and hygiene products",
  "Items damaged from normal wear and tear",
];

export default function ReturnsHelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Help Center
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Returns &amp; Refunds</h1>
      <p className="text-slate-500 mb-10">We want you to love what you ordered. Here&apos;s how returns work.</p>

      <div className="space-y-4 mb-12">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
            <div className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-indigo-600">
              {i + 1}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{s.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <XCircle className="h-4.5 w-4.5" /> Non-Returnable Items
        </h2>
        <ul className="space-y-2">
          {NON_RETURNABLE.map((item) => (
            <li key={item} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-slate-400 flex-shrink-0" /> {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
          Ready to start a return? Find your order and request one from your account.
        </p>
        <Link href="/account/orders" className="text-sm font-semibold text-indigo-600 hover:underline">
          Go to My Orders →
        </Link>
      </div>
    </div>
  );
}
