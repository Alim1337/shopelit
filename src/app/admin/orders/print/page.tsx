"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import type { OrderAddress } from "@/types";

interface ManifestOrder {
  id: string;
  orderNumber: string;
  total: string;
  createdAt: string;
  shippingAddress: OrderAddress;
  shippingMethodName: string | null;
}

function ManifestContent() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<ManifestOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const companyName = searchParams.get("companyName");

  useEffect(() => {
    const params = new URLSearchParams({ page: "1", limit: "100" });
    const shippingMethodId = searchParams.get("shippingMethodId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    if (shippingMethodId) params.set("shippingMethodId", shippingMethodId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);

    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setOrders(data.data.data);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const totalToCollect = orders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const deliveryCompany = orders[0]?.shippingMethodName || companyName || "Toutes compagnies";

  if (loading) return <p className="p-8 text-sm text-slate-500">Chargement...</p>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bordereau de livraison</h1>
          <p className="text-sm text-slate-500">{deliveryCompany} — {orders.length} commande(s)</p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimer
        </Button>
      </div>

      {/* Print header - only visible when printing */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold text-black">Bordereau de livraison — {deliveryCompany}</h1>
        <p className="text-sm text-slate-600">Généré le {formatDate(new Date())} — {orders.length} commande(s) — Total à encaisser : {formatPrice(totalToCollect)}</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune commande ne correspond à ces filtres.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="py-2 pr-3 font-semibold">#</th>
              <th className="py-2 pr-3 font-semibold">Commande</th>
              <th className="py-2 pr-3 font-semibold">Client</th>
              <th className="py-2 pr-3 font-semibold">Téléphone</th>
              <th className="py-2 pr-3 font-semibold">Adresse</th>
              <th className="py-2 pr-3 font-semibold text-right">À encaisser</th>
              <th className="py-2 pr-3 font-semibold">Signature</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id} className="border-b border-slate-200">
                <td className="py-2.5 pr-3 text-slate-500">{i + 1}</td>
                <td className="py-2.5 pr-3 font-mono text-xs">{o.orderNumber}</td>
                <td className="py-2.5 pr-3">
                  {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                </td>
                <td className="py-2.5 pr-3">{o.shippingAddress.phone}</td>
                <td className="py-2.5 pr-3">
                  {o.shippingAddress.addressLine1}, {o.shippingAddress.city}
                  {o.shippingAddress.state ? `, ${o.shippingAddress.state}` : ""}
                </td>
                <td className="py-2.5 pr-3 text-right font-semibold">{formatPrice(o.total)}</td>
                <td className="py-2.5 pr-3 w-24 border-l border-slate-200"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-900">
              <td colSpan={5} className="py-2.5 pr-3 text-right font-semibold">Total à encaisser</td>
              <td className="py-2.5 pr-3 text-right font-bold">{formatPrice(totalToCollect)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}

export default function OrdersManifestPage() {
  return (
    <Suspense fallback={null}>
      <ManifestContent />
    </Suspense>
  );
}
