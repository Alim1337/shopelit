import { Mail, Download } from "lucide-react";

export default function PressPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
          Press
        </span>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-4">Press &amp; Media</h1>
        <p className="text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
          Resources for journalists and media partners covering ShopElite.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4">
            <Download className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Brand Assets</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            Logos, product screenshots, and brand guidelines for editorial use.
          </p>
          <a href="mailto:presse@shopelite.dz" className="text-sm font-semibold text-indigo-600 hover:underline">
            Request media kit
          </a>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center mb-4">
            <Mail className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Media Inquiries</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-4">
            For interviews, quotes, or general press questions, reach our comms team directly.
          </p>
          <a href="mailto:presse@shopelite.dz" className="text-sm font-semibold text-indigo-600 hover:underline">
            presse@shopelite.dz
          </a>
        </div>
      </div>
    </div>
  );
}
