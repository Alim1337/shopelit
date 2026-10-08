const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly to us, such as your name, email address, shipping address, and payment details when you create an account or place an order. We also collect usage data automatically, including pages viewed and products browsed, to improve our services.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information to process orders, communicate with you about your account and purchases, personalize your shopping experience, and improve our platform. We do not sell your personal information to third parties.",
  },
  {
    title: "3. Information Sharing",
    body: "We share information with service providers who help us operate our business — such as payment processors and shipping carriers — only as needed to fulfill your orders. These providers are contractually obligated to protect your data.",
  },
  {
    title: "4. Cookies",
    body: "We use cookies and similar technologies to keep you signed in, remember your cart, and understand how our site is used. You can control cookie preferences through your browser settings.",
  },
  {
    title: "5. Data Security",
    body: "We implement industry-standard security measures, including encryption of sensitive data, to protect your information. No method of transmission over the internet is completely secure, but we work to protect your data.",
  },
  {
    title: "6. Your Rights",
    body: "You may access, update, or delete your account information at any time from your account settings. You may also contact us to request a copy of the data we hold about you.",
  },
  {
    title: "7. Changes to This Policy",
    body: "We may update this privacy policy from time to time. We will notify you of significant changes by posting a notice on our site or by email.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
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
            If you have questions about this policy, contact us at{" "}
            <a href="mailto:confidentialite@shopelite.dz" className="text-indigo-600 hover:underline">
              confidentialite@shopelite.dz
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
