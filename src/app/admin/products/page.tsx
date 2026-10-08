"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Trash2, Search, Pencil, Zap } from "lucide-react";
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
import ImageUploadField from "@/components/admin/image-upload";
import type { Product } from "@/types";

interface Taxonomy {
  id: string;
  name: string;
}

const emptyForm = {
  name: "",
  sku: "",
  price: "",
  compareAtPrice: "",
  stock: "",
  description: "",
  categoryId: "",
  brandId: "",
  status: "active",
  thumbnail: "",
  images: [] as string[],
  tags: "",
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  isOnSale: false,
  saleStartDate: "",
  saleEndDate: "",
};

type FormState = typeof emptyForm;

function toDatetimeLocal(date: Date | string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getSaleStatus(p: Product): { label: string; className: string } | null {
  if (!p.isOnSale) return null;
  const now = Date.now();
  const start = p.saleStartDate ? new Date(p.saleStartDate).getTime() : null;
  const end = p.saleEndDate ? new Date(p.saleEndDate).getTime() : null;

  if (start && now < start) {
    return { label: "Scheduled", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" };
  }
  if (end && now > end) {
    return { label: "Expired", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
  }
  return { label: "Live", className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400" };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Taxonomy[]>([]);
  const [brands, setBrands] = useState<Taxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "50" });
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      if (data.success) setProducts(data.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetch("/api/categories").then((r) => r.json()).then((d) => { if (d.success) setCategories(d.data); });
    fetch("/api/brands").then((r) => r.json()).then((d) => { if (d.success) setBrands(d.data); });
  }, [fetchProducts]);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      !categoryFilter ||
      (categoryFilter === "none" ? !p.categoryId : p.categoryId === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const openCreateDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      price: p.price.toString(),
      compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : "",
      stock: p.stock.toString(),
      description: p.description || "",
      categoryId: p.categoryId || "",
      brandId: p.brandId || "",
      status: p.status,
      thumbnail: p.thumbnail || "",
      images: p.images || [],
      tags: (p.tags || []).join(", "),
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
      isBestSeller: !!p.isBestSeller,
      isOnSale: !!p.isOnSale,
      saleStartDate: p.saleStartDate ? toDatetimeLocal(p.saleStartDate) : "",
      saleEndDate: p.saleEndDate ? toDatetimeLocal(p.saleEndDate) : "",
    });
    setDialogOpen(true);
  };

  const buildPayload = () => ({
    name: form.name,
    sku: form.sku,
    price: parseFloat(form.price),
    compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
    stock: parseInt(form.stock, 10) || 0,
    description: form.description || undefined,
    categoryId: form.categoryId || undefined,
    brandId: form.brandId || undefined,
    status: form.status,
    thumbnail: form.thumbnail || undefined,
    images: form.images,
    tags: form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    isFeatured: form.isFeatured,
    isNewArrival: form.isNewArrival,
    isBestSeller: form.isBestSeller,
    isOnSale: form.isOnSale,
    saleStartDate: form.isOnSale && form.saleStartDate ? new Date(form.saleStartDate).toISOString() : "",
    saleEndDate: form.isOnSale && form.saleEndDate ? new Date(form.saleEndDate).toISOString() : "",
    colors: [],
    sizes: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch(isEdit ? `/api/admin/products/${editingId}` : "/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || data.error || "Failed to save product");
        return;
      }
      toast.success(isEdit ? "Product updated" : "Product created");
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchProducts();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to delete product");
        return;
      }
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update product");
        return;
      }
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, status: status as Product["status"] } : p)));
      toast.success("Status updated");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Products</h1>
          <p className="text-slate-500 mt-1">
            {filtered.length} of {products.length} products
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or SKU..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All categories</option>
          <option value="none">No category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Product</th>
              <th className="text-left px-5 py-3 font-medium">SKU</th>
              <th className="text-left px-5 py-3 font-medium">Price</th>
              <th className="text-left px-5 py-3 font-medium">Stock</th>
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
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No products found.</td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        {p.thumbnail && <Image src={p.thumbnail} alt={p.name} fill className="object-cover" sizes="40px" />}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      {formatPrice(p.price)}
                      {(() => {
                        const saleStatus = getSaleStatus(p);
                        if (!saleStatus) return null;
                        return (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${saleStatus.className}`}>
                            <Zap className="h-2.5 w-2.5" />
                            {saleStatus.label}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{p.stock}</td>
                  <td className="px-5 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => handleStatusChange(p.id, e.target.value)}
                      className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEditDialog(p)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        aria-label="Edit product"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        aria-label="Delete product"
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
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />

            <div className="grid grid-cols-2 gap-3">
              <Input label="Price" type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input label="Compare-at price" type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Stock" type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Brand</label>
                <select
                  value={form.brandId}
                  onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">None</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <ImageUploadField
              label="Thumbnail"
              images={form.thumbnail ? [form.thumbnail] : []}
              onChange={(imgs) => setForm({ ...form, thumbnail: imgs[0] || "" })}
              multiple={false}
            />
            <ImageUploadField
              label="Product Images"
              images={form.images}
              onChange={(imgs) => setForm({ ...form, images: imgs })}
              multiple
            />
            <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "isFeatured", label: "Featured" },
                { key: "isNewArrival", label: "New Arrival" },
                { key: "isBestSeller", label: "Best Seller" },
                { key: "isOnSale", label: "On Sale" },
              ].map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={form[f.key as keyof FormState] as boolean}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {f.label}
                </label>
              ))}
            </div>

            {form.isOnSale && (
              <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Flash Sale Window</p>
                </div>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">
                  Set when this sale starts and ends. Leave blank for an always-on sale.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Sale start"
                    type="datetime-local"
                    value={form.saleStartDate}
                    onChange={(e) => setForm({ ...form, saleStartDate: e.target.value })}
                  />
                  <Input
                    label="Sale end"
                    type="datetime-local"
                    value={form.saleEndDate}
                    onChange={(e) => setForm({ ...form, saleEndDate: e.target.value })}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" loading={saving} className="w-full">
                {editingId ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}