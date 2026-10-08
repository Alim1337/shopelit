"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSubscribed(true);
        toast.success(data.message || "Successfully subscribed!");
      } else {
        toast.error(data.error || "Failed to subscribe");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 py-16 sm:px-16">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative text-center max-w-2xl mx-auto">
            {/* Icon */}
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-6">
              <Mail className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Get the Latest Deals
            </h2>
            <p className="text-indigo-200 text-lg mb-8">
              Subscribe to our newsletter and be the first to know about exclusive offers, new arrivals, and flash sales.
            </p>

            {/* Form */}
            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-white text-xl font-semibold">You're subscribed! 🎉</p>
                <p className="text-indigo-200">Check your inbox for a welcome gift.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="flex-1 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-5 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {loading ? (
                    <div className="h-5 w-5 rounded-full border-2 border-indigo-700/30 border-t-indigo-700 animate-spin" />
                  ) : (
                    <>
                      Subscribe <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="text-xs text-indigo-300 mt-4">
              No spam. Unsubscribe at any time. 🔒 Privacy protected.
            </p>

            {/* Features */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-indigo-200">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Exclusive deals
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                New arrivals first
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Flash sale alerts
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
