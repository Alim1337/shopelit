import { Mail, MapPin, Briefcase } from "lucide-react";

const OPENINGS = [
  { title: "Senior Frontend Engineer", team: "Engineering", location: "Remote" },
  { title: "Product Designer", team: "Design", location: "Remote" },
  { title: "Customer Support Specialist", team: "Support", location: "New York, NY" },
  { title: "Growth Marketing Manager", team: "Marketing", location: "Remote" },
];

export default function CareersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-14">
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-full">
          Careers
        </span>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-4">Build the future of shopping with us</h1>
        <p className="text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
          We&apos;re a small, remote-friendly team obsessed with making online shopping feel effortless. Come help
          us build it.
        </p>
      </div>

      <div className="space-y-3">
        {OPENINGS.map((job) => (
          <div
            key={job.title}
            className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5"
          >
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{job.title}</h3>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {job.team}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
              </div>
            </div>
            <a
              href="mailto:emploi@shopelite.dz"
              className="text-sm font-semibold text-indigo-600 hover:underline flex-shrink-0"
            >
              Apply
            </a>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center text-sm text-slate-500 flex items-center justify-center gap-1.5">
        <Mail className="h-4 w-4" /> Don&apos;t see your role?{" "}
        <a href="mailto:emploi@shopelite.dz" className="text-indigo-600 font-medium hover:underline">
          Reach out anyway
        </a>
      </div>
    </div>
  );
}
