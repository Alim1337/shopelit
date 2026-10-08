"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Search, Pencil, Ticket, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

type CouponType = "percentage" | "fixed" | "free_shipping";

interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  minimumAmount: string | null;
  maximumDiscount: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  description: string | null;
}

const emptyForm = {
  code: "",
  type: "percentage" as CouponType,
  value: "",
  minimumAmount: "",
  maximumDiscount: "",
  usageLimit: "",
  usageLimitPerUser: "",
  startsAt: "",
  expiresAt: "",
  description: "",
  isActive: true,
};

type FormState = typeof emptyForm;

const selectClass =
  "w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

function toDatetimeLocal(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type StatusKey = "active" | "inactive" | "scheduled" | "expired" | "used_up";

function getStatus(c: Coupon): { key: StatusKey; label: string; className: string } {
  const now = Date.now();
  if (!c.isActive) {
    return { key: "inactive", label: "Inactive", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
  }
  if (c.startsAt && new Date(c.startsAt).getTime() > now) {
    return { key: "scheduled", label: "Scheduled", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" };
  }
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) {
    return { key: "expired", label: "Expired", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
  }
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
    return { key: "used_up", label: "Used up", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" };
  }
  return { key: "active", label: "Active", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" };
}

function describeValue(c: Coupon): string {
  if (c.type === "percentage") {
    const max = c.maximumDiscount ? ` (max ${formatPrice(c.maximumDiscount)})` : "";
    return `${Number(c.value)}% off${max}`;
  }
  if (c.type === "fixed") return `${formatPrice(c.value)} off`;
  return "Free shipping";
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return "SAVE-" + Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const toNumberOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | StatusKey>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  // Fetches the list; state is set by the callers (keeps the effect lint-clean)
  const loadCoupons = useCallback(async (): Promise<Coupon[] | null> => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) return data.data as Coupon[];
      toast.error(data.error || "Failed to load coupons");
    } catch {
      toast.error("Failed to load coupons");
    }
    return null;
  }, []);

  useEffect(() => {
    let active = true;
    loadCoupons().then((list) => {
      if (!active) return;
      if (list) setCoupons(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [loadCoupons]);

  const refreshCoupons = async () => {
    const list = await loadCoupons();
    if (list) setCoupons(list);
  };

  const filtered = coupons.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || getStatus(c).key === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.type === "free_shipping" ? "" : Number(c.value).toString(),
      minimumAmount: c.minimumAmount ? Number(c.minimumAmount).toString() : "",
      maximumDiscount: c.maximumDiscount ? Number(c.maximumDiscount).toString() : "",
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : "",
      usageLimitPerUser: c.usageLimitPerUser != null ? String(c.usageLimitPerUser) : "",
      startsAt: c.startsAt ? toDatetimeLocal(c.startsAt) : "",
      expiresAt: c.expiresAt ? toDatetimeLocal(c.expiresAt) : "",
      description: c.description || "",
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const buildPayload = () => ({
    code: form.code,
    type: form.type,
    value: form.type === "free_shipping" ? 0 : Number(form.value),
    minimumAmount: toNumberOrNull(form.minimumAmount),
    maximumDiscount: form.type === "percentage" ? toNumberOrNull(form.maximumDiscount) : null,
    usageLimit: toNumberOrNull(form.usageLimit),
    usageLimitPerUser: toNumberOrNull(form.usageLimitPerUser),
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    description: form.description.trim() || null,
    isActive: form.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch(isEdit ? `/api/admin/coupons/${editingId}` : "/api/admin/coupons", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || data.error || "Failed to save coupon");
        return;
      }
      toast.success(isEdit ? "Coupon updated" : "Coupon created");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      refreshCoupons();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || data.error || "Failed to update coupon");
        return;
      }
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)));
      toast.success(c.isActive ? "Coupon deactivated" : "Coupon activated");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDelete = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to delete coupon");
        return;
      }
      if (data.data?.deactivated) {
        toast.info(data.message);
        setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: false } : x)));
      } else {
        toast.success("Coupon deleted");
        setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const valueLabel =
    form.type === "percentage" ? "Discount (%)" : form.type === "fixed" ? "Discount amount" : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Coupons</h1>
          <p className="text-slate-500 mt-1">
            {filtered.length} of {coupons.length} coupons
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by code or description..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | StatusKey)}
          aria-label="Filter by status"
          className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="used_up">Used up</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Code</th>
              <th className="text-left px-5 py-3 font-medium">Discount</th>
              <th className="text-left px-5 py-3 font-medium">Used</th>
              <th className="text-left px-5 py-3 font-medium">Valid</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  {coupons.length === 0 ? "No coupons yet. Create your first one." : "No coupons match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const status = getStatus(c);
                return (
                  <tr key={c.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <div>
                          <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">{c.code}</p>
                          {c.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">{c.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-300">
                      <p className="font-medium">{describeValue(c)}</p>
                      {c.minimumAmount && Number(c.minimumAmount) > 0 && (
                        <p className="text-xs text-slate-500">Min. order {formatPrice(c.minimumAmount)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                      {c.usedCount}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                      {c.usageLimitPerUser != null && (
                        <p className="text-xs text-slate-500">{c.usageLimitPerUser} per customer</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {c.startsAt || c.expiresAt ? (
                        <>
                          {formatDate(c.startsAt)} → {formatDate(c.expiresAt)}
                        </>
                      ) : (
                        "Always"
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleToggleActive(c)}
                        title={c.isActive ? "Click to deactivate" : "Click to activate"}
                        className={`inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full transition-opacity hover:opacity-80 ${status.className}`}
                      >
                        {status.label}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => openEditDialog(c)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          aria-label="Edit coupon"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                          aria-label="Delete coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Code"
                required
                placeholder="WELCOME10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, code: generateCode() })}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
              >
                <Wand2 className="h-3 w-3" /> Generate a random code
              </button>
            </div>

            <div className={form.type === "free_shipping" ? "" : "grid grid-cols-2 gap-3"}>
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
                  className={selectClass}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </div>
              {form.type !== "free_shipping" && (
                <Input
                  label={valueLabel}
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.type === "percentage" ? "100" : undefined}
                  required
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Minimum order amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="No minimum"
                value={form.minimumAmount}
                onChange={(e) => setForm({ ...form, minimumAmount: e.target.value })}
              />
              {form.type === "percentage" && (
                <Input
                  label="Maximum discount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No cap"
                  value={form.maximumDiscount}
                  onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Total usage limit"
                type="number"
                min="1"
                step="1"
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
              />
              <Input
                label="Limit per customer"
                type="number"
                min="1"
                step="1"
                placeholder="Unlimited"
                value={form.usageLimitPerUser}
                onChange={(e) => setForm({ ...form, usageLimitPerUser: e.target.value })}
              />
            </div>
            {form.usageLimitPerUser && (
              <p className="-mt-2 text-xs text-slate-500">
                Per-customer limits require customers to be signed in with a verified email.
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Starts at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
              <Input
                label="Expires at"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description (internal)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                maxLength={500}
                className={selectClass}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Active (customers can use this coupon)
            </label>

            <DialogFooter>
              <Button type="submit" loading={saving} className="w-full">
                {editingId ? "Save Changes" : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
