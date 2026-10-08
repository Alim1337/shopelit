"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Check, X, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: "pending" | "approved" | "rejected";
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  createdAt: string;
  product: { id: string; name: string; slug: string; thumbnail: string | null } | null;
  user: { id: string; name: string | null; email: string } | null;
}

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50", status });
      const res = await fetch(`/api/admin/reviews?${params}`);
      const data = await res.json();
      if (data.success) setReviews(data.data.data);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleModerate = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update review");
        return;
      }
      toast.success(newStatus === "approved" ? "Review approved" : "Review rejected");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to delete review");
        return;
      }
      toast.success("Review deleted");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reviews</h1>
        <p className="text-slate-500 mt-1">Moderate customer reviews before they go live.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              status === t.value
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <p className="text-slate-500">No {status} reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {r.product && (
                    <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                      {r.product.thumbnail && (
                        <Image src={r.product.thumbnail} alt={r.product.name} fill className="object-cover" sizes="48px" />
                      )}
                    </div>
                  )}
                  <div>
                    {r.product && (
                      <Link href={`/products/${r.product.slug}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-indigo-600 transition-colors">
                        {r.product.name}
                      </Link>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                        ))}
                      </div>
                      {r.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <ShieldCheck className="h-3.5 w-3.5" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.user?.name || r.user?.email} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                </div>

                {status === "pending" && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleModerate(r.id, "approved")}
                      className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 transition-colors"
                      aria-label="Approve review"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleModerate(r.id, "rejected")}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900 transition-colors"
                      aria-label="Reject review"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {status !== "pending" && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {r.title && <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-3">{r.title}</p>}
              {r.content && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{r.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
