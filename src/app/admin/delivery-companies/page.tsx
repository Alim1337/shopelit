"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

interface DeliveryCompany {
  id: string;
  name: string;
  description: string | null;
  price: string;
  estimatedDays: number | null;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  estimatedDays: "",
  isActive: true,
};

export default function AdminDeliveryCompaniesPage() {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-companies");
      const data = await res.json();
      if (data.success) setCompanies(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (c: DeliveryCompany) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      description: c.description || "",
      price: c.price,
      estimatedDays: c.estimatedDays?.toString() || "",
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch(
        isEdit ? `/api/admin/delivery-companies/${editingId}` : "/api/admin/delivery-companies",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description || undefined,
            price: parseFloat(form.price) || 0,
            estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays, 10) : undefined,
            isActive: form.isActive,
          }),
        }
      );
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || data.error || "Failed to save delivery company");
        return;
      }
      toast.success(isEdit ? "Delivery company updated" : "Delivery company added");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchCompanies();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/delivery-companies/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to remove delivery company");
        return;
      }
      toast.success(data.message || "Removed");
      fetchCompanies();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Delivery Companies</h1>
          <p className="text-slate-500 mt-1">
            Companies customers can choose from at checkout. Payment is collected in cash on delivery.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Company</th>
              <th className="text-left px-5 py-3 font-medium">Delivery Fee</th>
              <th className="text-left px-5 py-3 font-medium">Est. Days</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">Loading...</td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No delivery companies yet. Add one so customers can choose it at checkout.
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center flex-shrink-0">
                        <Truck className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                        {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {parseFloat(c.price) === 0 ? "Free" : formatPrice(c.price)}
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                    {c.estimatedDays ? `${c.estimatedDays} day(s)` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={c.isActive ? "success" : "secondary"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditDialog(c)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        aria-label="Edit company"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Remove company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Delivery Company" : "Add Delivery Company"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company name"
              placeholder="e.g. Livraison Express"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Description (optional)"
              placeholder="e.g. Livraison à domicile sous 48h"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Delivery fee"
                type="number"
                step="0.01"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <Input
                label="Estimated days"
                type="number"
                value={form.estimatedDays}
                onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Active (visible at checkout)
            </label>
            <DialogFooter>
              <Button type="submit" loading={saving} className="w-full">
                {editingId ? "Save Changes" : "Add Company"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
