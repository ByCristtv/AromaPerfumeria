"use client";

import type { PaymentMethod } from "@/schemas/checkout";

interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  description: string;
}

/**
 * Order matters — the first option is the default (see checkoutFormDefaults).
 * Adding a method here is presentation only; the server resolves it through the
 * payment processor registry.
 */
const OPTIONS: readonly PaymentMethodOption[] = [
  {
    value: "card",
    label: "Tarjeta / Pagos digitales",
    description: "Pago inmediato y seguro procesado por ONVO.",
  },
  {
    value: "sinpe",
    label: "SINPE Móvil",
    description: "Transfiere y envía el comprobante por WhatsApp.",
  },
] as const;

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  disabled?: boolean;
}

/**
 * Radio-card picker for the payment method.
 *
 * Native radios kept visually hidden rather than replaced with divs: that keeps
 * arrow-key navigation, form semantics, and screen-reader announcements for free,
 * while the card styling comes from peer-checked. The visible ring is driven by
 * :focus-visible so keyboard users see focus and mouse users don't.
 */
export default function PaymentMethodSelector({
  value,
  onChange,
  disabled,
}: PaymentMethodSelectorProps) {
  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="sr-only">Método de pago</legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="relative flex cursor-pointer rounded-lg border border-gray-300 bg-white p-4 transition has-[:checked]:border-black has-[:checked]:ring-1 has-[:checked]:ring-black has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gray-400 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
          >
            <input
              type="radio"
              name="payment_method"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900">
                {option.label}
              </span>
              <span className="block text-xs text-gray-500 mt-0.5">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
