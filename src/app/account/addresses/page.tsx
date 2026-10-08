"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddressForm, { AddressFormValues, emptyAddressForm } from "@/components/account/address-form";

interface SavedAddress extends AddressFormValues {
  id: string;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = () => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setAddresses(data.data);
      })
      .catch(() => {
        toast.error("Failed to load addresses");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const editingAddress = addresses.find((a) => a.id === editingId);

  const handleSubmit = async (values: AddressFormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(editingId ? `/api/addresses/${editingId}` : "/api/addresses", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to save address");
        return;
      }
      toast.success(editingId ? "Address updated" : "Address saved");
      setShowForm(false);
      setEditingId(null);
      fetchAddresses();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to delete address");
        return;
      }
      toast.success("Address deleted");
      fetchAddresses();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleMakeDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update address");
        return;
      }
      fetchAddresses();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Addresses</h1>
          <p className="text-sm text-slate-500 mt-1">
            Save addresses to check out faster next time.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => {
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" /> Add Address
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Address" : "New Address"}</CardTitle>
            <CardDescription>Fill in the delivery details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddressForm
              initialValues={editingAddress || emptyAddressForm}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              submitting={submitting}
              submitLabel={editingId ? "Update Address" : "Save Address"}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : addresses.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">You haven&apos;t saved any addresses yet.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4" /> Add your first address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className={addr.isDefault ? "border-indigo-300 dark:border-indigo-800" : undefined}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {addr.firstName} {addr.lastName}
                    </p>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                        <Star className="h-2.5 w-2.5 fill-current" /> Default
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {addr.addressLine1}
                  {addr.addressLine2 && <>, {addr.addressLine2}</>}
                  <br />
                  {addr.city}
                  {addr.state && <>, {addr.state}</>}
                  <br />
                  {addr.country}
                  {addr.phone && (
                    <>
                      <br />
                      {addr.phone}
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(addr.id);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {!addr.isDefault && (
                    <Button size="sm" variant="ghost" onClick={() => handleMakeDefault(addr.id)}>
                      Make default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 ml-auto"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
