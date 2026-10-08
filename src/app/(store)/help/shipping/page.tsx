"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface ShippingMethod {
  id: string;
  name: string;
  description: string | null;
  price: string;
  freeShippingThreshold: string | null;
  estimatedDays: string | null;
  zoneName: string;
}

export default function ShippingHelpPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shipping/methods")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setMethods(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <Link href="/help" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Help Center
      </Link>

      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Shipping Information</h1>
      <p className="text-slate-500 mb-10">Everything you need to know about how we get your order to you.</p>

      <div className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Truck className="h-4.5 w-4.5" /> Available Shipping Methods
        </h2>

        {loading ? (
          <p className="text-sm text-slate-500">Loading shipping options...</p>
        ) : methods.length === 0 ? (
          <p className="text-sm text-slate-500">Shipping options will be shown at checkout.</p>
        ) : (
          <div className="space-y-3">
            {methods.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{m.name}</p>
                  {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{m.zoneName}{m.estimatedDays ? ` · ${m.estimatedDays}` : ""}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">
                  {parseFloat(m.price) === 0 ? "Free" : formatPrice(m.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Traitement des commandes</h3>
          <p>Les commandes sont généralement traitées sous 1 à 2 jours ouvrés. Nous vous appelons pour confirmer avant expédition.</p>
        </section>
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Paiement à la livraison</h3>
          <p>
            Toutes les commandes sont payables en espèces à la réception. Aucun paiement en ligne n&apos;est requis. Vous réglez le livreur directement.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Suivi de commande</h3>
          <p>
            Suivez votre commande depuis{" "}
            <Link href="/account/orders" className="text-indigo-600 hover:underline">votre compte</Link>{" "}
            ou via la page <Link href="/track-order" className="text-indigo-600 hover:underline">Suivi de commande</Link> sans connexion.
          </p>
        </section>
        <section>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">Zone de livraison</h3>
          <p>Nous livrons dans les 58 wilayas d&apos;Algérie. Les délais et frais varient selon la compagnie de livraison choisie au moment du passage de commande.</p>
        </section>
      </div>
    </div>
  );
}
