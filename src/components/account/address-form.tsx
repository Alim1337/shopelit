"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface AddressFormValues {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export const emptyAddressForm: AddressFormValues = {
  firstName: "",
  lastName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Algérie",
  phone: "",
  isDefault: false,
};

interface AddressFormProps {
  initialValues?: AddressFormValues;
  onSubmit: (values: AddressFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  submitting?: boolean;
  showDefaultToggle?: boolean;
}

export default function AddressForm({
  initialValues = emptyAddressForm,
  onSubmit,
  onCancel,
  submitLabel = "Save Address",
  submitting = false,
  showDefaultToggle = true,
}: AddressFormProps) {
  const [values, setValues] = useState<AddressFormValues>(initialValues);

  const update = (field: keyof AddressFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          required
          value={values.firstName}
          onChange={(e) => update("firstName", e.target.value)}
        />
        <Input
          label="Last name"
          required
          value={values.lastName}
          onChange={(e) => update("lastName", e.target.value)}
        />
      </div>
      <Input
        label="Phone"
        type="tel"
        placeholder="05XX XX XX XX"
        value={values.phone}
        onChange={(e) => update("phone", e.target.value)}
      />
      <Input
        label="Address"
        required
        value={values.addressLine1}
        onChange={(e) => update("addressLine1", e.target.value)}
      />
      <Input
        label="Apartment, suite, etc. (optional)"
        value={values.addressLine2}
        onChange={(e) => update("addressLine2", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="City"
          required
          value={values.city}
          onChange={(e) => update("city", e.target.value)}
        />
        <Input
          label="State / Wilaya"
          value={values.state}
          onChange={(e) => update("state", e.target.value)}
        />
      </div>

      {showDefaultToggle && (
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 pt-1">
          <input
            type="checkbox"
            checked={values.isDefault}
            onChange={(e) => update("isDefault", e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Set as default address
        </label>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" loading={submitting}>
          {!submitting && submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
