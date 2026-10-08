"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const [user, setUser] = useState<{ id: string; name: string | null } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; content?: string }>({});

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setUser(data.data.user);
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: { rating?: string; content?: string } = {};
    if (rating < 1) nextErrors.rating = "Please select a rating";
    if (content.trim().length < 10) nextErrors.content = "Review must be at least 10 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim() || undefined,
          content: content.trim(),
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        toast.success("Review submitted! It will appear after moderation.");
        onReviewSubmitted?.();
      } else {
        toast.error(data.error || "Failed to submit review.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Sign in to write a review for this product.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950 p-6 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Thanks for your review!
        </h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          It will appear on this page once it&apos;s been moderated.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
    >
      <h4 className="font-semibold text-slate-900 dark:text-slate-100">
        Write a Review
      </h4>

      {/* Star rating */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Your Rating
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                }`}
              />
            </button>
          ))}
        </div>
        {errors.rating && (
          <p className="mt-1.5 text-xs text-red-500">{errors.rating}</p>
        )}
      </div>

      <Input
        label="Title (optional)"
        placeholder="Sum up your experience"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />

      <Textarea
        label="Your Review"
        placeholder="Share your thoughts about this product..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        maxLength={5000}
        error={errors.content}
      />

      <Button type="submit" disabled={submitting} loading={submitting}>
        {!submitting && "Submit Review"}
      </Button>
    </form>
  );
}
