"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, Pencil, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ImageUploadField from "@/components/admin/image-upload";

interface AdminBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

const emptyForm = { name: "", description: "", logo: "", website: "", sortOrder: "0", isActive: true };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/brands");
      const data = await res.json();
      if (data.success) setBrands(data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const openCreateDialog = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (b: AdminBrand) => {
    setEditingId(b.id);
    setForm({ name: b.name, description: b.description || "", logo: b.logo || "", website: b.website || "", sortOrder: b.sortOrder.toString(), isActive: b.isActive });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch(isEdit ? `/api/admin/brands/${editingId}` : "/api/admin/brands", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description || undefined, logo: form.logo || undefined, website: form.website || undefined, sortOrder: parseInt(form.sortOrder, 10) || 0, isActive: form.isActive }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.message || data.error || "Failed to save brand"); return; }
      toast.success(isEdit ? "Brand updated" : "Brand created");
      setDialogOpen(false); setForm(emptyForm); setEditingId(null); fetchBrands();
    } catch { toast.error("Something went wrong"); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) { toast.error(`Remove the ${productCount} product(s) in "${name}" first.`); return; }
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { toast.error(data.error || "Failed to delete brand"); return; }
      toast.success("Brand deleted");
      setBrands((prev) => prev.filter((b) => b.id !== id));
    } catch { toast.error("Something went wrong"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Brands</h1>
          <p className="text-slate-500 mt-1">{brands.length} brands</p>
        </div>
        <Button onClick={openCreateDialog}><Plus className="h-4 w-4" /> Add Brand</Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Brand</th>
              <th className="text-left px-5 py-3 font-medium">Products</th>
              <th className="text-left px-5 py-3 font-medium">Status</th>
              <th className="text-right px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : brands.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No brands yet.</td></tr>
            ) : brands.map((b) => (
              <tr key={b.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center">
                      {b.logo ? <Image src={b.logo} alt={b.name} fill className="object-contain p-1" sizes="40px" /> : <span className="text-base font-bold text-indigo-600">{b.name[0]}</span>}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{b.name}</p>
                      {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">{b.website}</a>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-400"><span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" />{b.productCount}</span></td>
                <td className="px-5 py-3"><Badge variant={b.isActive ? "success" : "secondary"}>{b.isActive ? "Active" : "Inactive"}</Badge></td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <button onClick={() => openEditDialog(b)} className="text-slate-400 hover:text-indigo-600 transition-colors" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(b.id, b.name, b.productCount)} className="text-slate-400 hover:text-red-500 transition-colors" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Brand" : "Add Brand"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <ImageUploadField
              label="Logo"
              images={form.logo ? [form.logo] : []}
              onChange={(imgs) => setForm({ ...form, logo: imgs[0] || "" })}
              multiple={false}
            />
            <Input label="Website (optional)" placeholder="https://..." value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <div className="grid grid-cols-2 gap-3 items-end">
              <Input label="Sort order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 pb-2.5">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Active (visible in store)
              </label>
            </div>
            <DialogFooter><Button type="submit" loading={saving} className="w-full">{editingId ? "Save Changes" : "Create Brand"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
