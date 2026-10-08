const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using ShopElite, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.",
  },
  {
    title: "2. Accounts",
    body: "You must provide accurate information when creating an account and are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activity that occurs under your account.",
  },
  {
    title: "3. Orders and Payment",
    body: "All orders are subject to acceptance and availability. Prices are listed in Algerian Dinar (DZD) and may change without notice. Payment is collected in cash at the time of delivery.",
  },
  {
    title: "4. Shipping and Returns",
    body: "Shipping times are estimates and not guaranteed. Please refer to our Returns Policy for information on returning items and eligibility requirements.",
  },
  {
    title: "5. Prohibited Conduct",
    body: "You agree not to misuse the platform, including attempting to access accounts that are not yours, submitting fraudulent orders, or interfering with the normal operation of the site.",
  },
  {
    title: "6. Intellectual Property",
    body: "All content on ShopElite, including logos, text, and images, is the property of ShopElite or its licensors and may not be used without permission.",
  },
  {
    title: "7. Limitation of Liability",
    body: "ShopElite is not liable for indirect, incidental, or consequential damages arising from your use of the platform, to the fullest extent permitted by law.",
  },
  {
    title: "8. Changes to Terms",
    body: "We may revise these terms at any time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Terms of Service</h1>
      <p className="text-sm text-slate-500 mt-2">Last updated: January 1, 2026</p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{s.title}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.body}</p>
          </section>
        ))}

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Contact Us</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Questions about these terms? Contact us at{" "}
            <a href="mailto:juridique@shopelite.dz" className="text-indigo-600 hover:underline">
              juridique@shopelite.dz
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
