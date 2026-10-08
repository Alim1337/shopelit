import { Sparkles, ShieldCheck, Truck, HeartHandshake } from "lucide-react";

const VALUES = [
  { icon: Sparkles, title: "Curated Quality", text: "Every product is vetted for craftsmanship and durability before it reaches our catalog." },
  { icon: ShieldCheck, title: "Buyer Protection", text: "Secure checkout, transparent policies, and a team that has your back." },
  { icon: Truck, title: "Reliable Delivery", text: "Fast, trackable shipping with partners we trust en Algérie." },
  { icon: HeartHandshake, title: "Real Support", text: "A human team ready to help before and after your purchase." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
          Our Story
        </span>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-4">About ShopElite</h1>
        <p className="text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
          ShopElite was built on a simple idea: premium products shouldn&apos;t come with a painful shopping
          experience. We bring together trusted brands, honest pricing, and a platform designed around the
          customer — not the other way around.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-16">
        {VALUES.map((v) => (
          <div key={v.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4">
              <v.icon className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">{v.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-10 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Join thousands of happy shoppers</h2>
        <p className="text-indigo-100 max-w-lg mx-auto">
          We&apos;re just getting started — thank you for being part of the journey.
        </p>
      </div>
    </div>
  );
}
