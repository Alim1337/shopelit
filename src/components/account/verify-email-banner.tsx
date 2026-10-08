"use client";

import { useState } from "react";
import { MailWarning } from "lucide-react";
import { toast } from "sonner";

export default function VerifyEmailBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Could not send the email. Please try again.");
        return;
      }
      setSent(true);
      toast.success("Verification email sent. Check your inbox.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"
    >
      <MailWarning className="h-5 w-5 flex-shrink-0 text-amber-600" />
      <p className="min-w-0 flex-1 text-sm text-amber-800 dark:text-amber-300">
        Please verify your email address (<span className="font-medium">{email}</span>) to secure your
        account and use customer-only coupons.
      </p>
      <button
        type="button"
        onClick={resend}
        disabled={sending || sent}
        className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
      >
        {sent ? "Email sent" : sending ? "Sending…" : "Resend email"}
      </button>
    </div>
  );
}
