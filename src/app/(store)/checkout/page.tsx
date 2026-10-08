"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Truck, Banknote, Phone, MapPin, Plus, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cart.store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice, cn } from "@/lib/utils";
import type { OrderAddress } from "@/types";

interface DeliveryCompany {
  id: string;
  name: string;
  description: string | null;
  price: string;
  estimatedDays: string | null;
}

interface SavedAddress extends OrderAddress {
  id: string;
  isDefault: boolean;
}

const emptyAddress: OrderAddress = {
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Algérie",
  phone: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, coupon, getSubtotal, getDiscount, clearCart } = useCartStore();
  const hasMounted = useHasMounted();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  const [address, setAddress] = useState<OrderAddress>(emptyAddress);
  const [notes, setNotes] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [deliveryCompanyId, setDeliveryCompanyId] = useState("");
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) router.replace("/cart");
  }, [items.length, router]);

  useEffect(() => {
    fetch("/api/shipping/methods")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCompanies(data.data);
          if (data.data[0]) setDeliveryCompanyId(data.data[0].id);
        }
      })
      .finally(() => setLoadingCompanies(false));
  }, []);

  // Load saved addresses for logged-in users
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(async (meData) => {
        if (!meData.success) return;
        setIsLoggedIn(true);

        const res = await fetch("/api/addresses");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setSavedAddresses(data.data);
          const defaultAddr = data.data.find((a: SavedAddress) => a.isDefault) || data.data[0];
          setSelectedAddressId(defaultAddr.id);
          setAddress(defaultAddr);
        } else {
          setSelectedAddressId("new");
        }
      })
      .catch(() => {});
  }, []);

  const selectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setAddress(addr);
    setSaveNewAddress(false);
  };

  const selectNewAddress = () => {
    setSelectedAddressId("new");
    setAddress(emptyAddress);
  };

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const selectedCompany = companies.find((c) => c.id === deliveryCompanyId);
  const deliveryFee = selectedCompany ? parseFloat(selectedCompany.price) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const updateAddress = (field: keyof OrderAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryCompanyId) {
      toast.error("Veuillez choisir une compagnie de livraison");
      return;
    }
    if (!address.phone) {
      toast.error("Le numéro de téléphone est requis pour confirmer votre commande");
      return;
    }
    setSubmitting(true);

    try {
      // Save the new address to the account, if requested
      if (isLoggedIn && selectedAddressId === "new" && saveNewAddress) {
        fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(address),
        }).catch(() => {});
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingAddress: address,
          shippingAddress: address,
          shippingMethodId: deliveryCompanyId,
          paymentMethod: "cash_on_delivery",
          couponCode: coupon?.code,
          notes: notes || undefined,
          guestEmail: !isLoggedIn && guestEmail.trim() ? guestEmail.trim() : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId || undefined,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Échec de la commande");
        return;
      }

      clearCart();
      toast.success("Commande passée avec succès !");
      router.push(`/checkout/success?order=${data.data.orderNumber}`);
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hasMounted || items.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Commande</h1>
      <p className="text-slate-500 mb-8 flex items-center gap-1.5">
        <Banknote className="h-4 w-4" /> Paiement en espèces à la livraison
      </p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery address */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Adresse de livraison</h2>

            {isLoggedIn && savedAddresses.length > 0 && (
              <div className="space-y-2 mb-5">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors",
                      selectedAddressId === addr.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => selectSavedAddress(addr)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {addr.firstName} {addr.lastName}
                        </p>
                        {addr.isDefault && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                            Par défaut
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {addr.addressLine1}, {addr.city}{addr.state ? `, ${addr.state}` : ""}
                      </p>
                    </div>
                    {selectedAddressId === addr.id && <Check className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-1" />}
                  </label>
                ))}
                <label
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors",
                    selectedAddressId === "new"
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === "new"}
                    onChange={selectNewAddress}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Utiliser une nouvelle adresse
                  </span>
                </label>
              </div>
            )}

            {selectedAddressId === "new" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Prénom" required value={address.firstName} onChange={(e) => updateAddress("firstName", e.target.value)} />
                  <Input label="Nom" required value={address.lastName} onChange={(e) => updateAddress("lastName", e.target.value)} />
                </div>
                <div className="mt-3">
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="05XX XX XX XX"
                    required
                    leftIcon={<Phone className="h-4 w-4" />}
                    hint="Nous vous appellerons pour confirmer votre commande"
                    value={address.phone}
                    onChange={(e) => updateAddress("phone", e.target.value)}
                  />
                </div>
                {!isLoggedIn && (
                  <div className="mt-3">
                    <Input
                      label="Email (optionnel)"
                      type="email"
                      placeholder="vous@exemple.com"
                      leftIcon={<Mail className="h-4 w-4" />}
                      hint="Pour recevoir la confirmation et suivre votre commande"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>
                )}
                <div className="mt-3">
                  <Input label="Adresse" required value={address.addressLine1} onChange={(e) => updateAddress("addressLine1", e.target.value)} />
                </div>
                <div className="mt-3">
                  <Input label="Complément d'adresse (optionnel)" value={address.addressLine2} onChange={(e) => updateAddress("addressLine2", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Input label="Ville" required value={address.city} onChange={(e) => updateAddress("city", e.target.value)} />
                  <Input label="Wilaya" required value={address.state} onChange={(e) => updateAddress("state", e.target.value)} />
                </div>
                {isLoggedIn && (
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-3">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <MapPin className="h-3.5 w-3.5" /> Enregistrer cette adresse pour la prochaine fois
                  </label>
                )}
              </>
            )}
          </section>

          {/* Delivery company */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Compagnie de livraison
            </h2>
            {loadingCompanies ? (
              <p className="text-sm text-slate-500">Chargement...</p>
            ) : companies.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune compagnie de livraison disponible pour le moment.</p>
            ) : (
              <div className="space-y-2">
                {companies.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex items-center justify-between gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors",
                      deliveryCompanyId === c.id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="deliveryCompany"
                        checked={deliveryCompanyId === c.id}
                        onChange={() => setDeliveryCompanyId(c.id)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{c.name}</p>
                        {c.description && <p className="text-xs text-slate-500">{c.description}</p>}
                        {c.estimatedDays && <p className="text-xs text-slate-500">Livraison sous {c.estimatedDays} jour(s)</p>}
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {parseFloat(c.price) === 0 ? "Gratuit" : formatPrice(c.price)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Notes (optionnel)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Instructions de livraison, précisions sur l'adresse, etc."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </section>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Résumé</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400 line-clamp-1 pr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100 flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Livraison</span>
                <span>{deliveryFee === 0 ? "Gratuit" : formatPrice(deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Réduction ({coupon?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 mt-4 pt-4">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Total à payer</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{formatPrice(total)}</span>
            </div>

            <Button type="submit" className="w-full mt-6" size="lg" loading={submitting}>
              <Banknote className="h-4 w-4" /> Confirmer la commande
            </Button>
            <p className="text-xs text-slate-400 text-center mt-3 flex items-center justify-center gap-1">
              <Phone className="h-3.5 w-3.5" /> Nous vous appellerons pour confirmer
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}