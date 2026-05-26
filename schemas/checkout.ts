/**
 * Checkout validation schema + payload builder.
 *
 * Two related pieces:
 *   1. `checkoutFormSchema` — what react-hook-form validates while the user fills the form.
 *      Mirrors the visible input fields (customer + shipping + notes). Items
 *      live in the cart store, not the form.
 *   2. `buildCheckoutPayload()` — assembles the JSON payload sent to the
 *      `/api/checkout/session` route (Phase 4) by joining validated form
 *      values with cart contents and deriving canton/province display names.
 *
 * Snake_case is used throughout to match the place_order RPC's payload contract,
 * eliminating a camelCase ↔ snake_case translation layer.
 */

import { z } from "zod";
import { findCanton, findProvince, isValidCantonCode } from "@/lib/cr-geo";
import type { CartLineItem } from "@/types/product";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Ingresa tu nombre completo" })
    .max(100, { message: "Nombre demasiado largo" }),
  email: z
    .string()
    .trim()
    .email({ message: "Correo electrónico inválido" })
    .max(254, { message: "Correo electrónico demasiado largo" }),
  phone: z
    .string()
    .trim()
    .min(8, { message: "Teléfono inválido (mínimo 8 dígitos)" })
    .max(20, { message: "Teléfono demasiado largo" }),
});

const shippingSchema = z.object({
  address: z
    .string()
    .trim()
    .min(10, { message: "Escribe las señas exactas (al menos 10 caracteres)" })
    .max(500, { message: "Dirección demasiado larga" }),
  canton_code: z
    .string()
    .refine(isValidCantonCode, { message: "Selecciona un cantón válido" }),
  // district + reference: optional in the payload, but the form fields always
  // submit strings (possibly empty). Empty strings are allowed here; they get
  // stripped to undefined in buildCheckoutPayload.
  district: z
    .string()
    .trim()
    .max(100, { message: "Distrito demasiado largo" }),
  reference: z
    .string()
    .trim()
    .max(200, { message: "Referencia demasiado larga" }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Form schema (what react-hook-form validates)
// ─────────────────────────────────────────────────────────────────────────────

export const checkoutFormSchema = z.object({
  customer: customerSchema,
  shipping: shippingSchema,
  notes: z
    .string()
    .trim()
    .max(500, { message: "Notas demasiado largas" }),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API-side payload schema — what /api/checkout/session validates server-side.
// ─────────────────────────────────────────────────────────────────────────────
//
// The client-side form schema only covers user-input fields. The API payload
// adds the derived canton_name/province_name fields (filled in by
// buildCheckoutPayload from the CR-geo dataset) and the items array (read
// from the cart at submit time).
//
// We re-validate everything server-side because the API route is a public
// HTTP endpoint and we never trust client-validated data. A malicious user
// can curl arbitrary JSON to /api/checkout/session.

const lineItemSchema = z.object({
  variant_id: z.string().uuid({ message: "variant_id debe ser un UUID válido" }),
  quantity: z
    .number()
    .int({ message: "quantity debe ser un entero" })
    .positive({ message: "quantity debe ser positivo" })
    .max(99, { message: "quantity excede el máximo permitido" }),
});

const shippingPayloadSchema = shippingSchema.extend({
  canton_name: z
    .string()
    .trim()
    .min(1, { message: "shipping.canton_name es requerido" })
    .max(100),
  province_name: z
    .string()
    .trim()
    .min(1, { message: "shipping.province_name es requerido" })
    .max(100),
});

export const checkoutPayloadSchema = z.object({
  customer: customerSchema,
  shipping: shippingPayloadSchema,
  items: z
    .array(lineItemSchema)
    .min(1, { message: "items no puede estar vacío" })
    .max(100, { message: "Demasiados artículos en el pedido" }),
  notes: z
    .string()
    .trim()
    .max(500, { message: "Notas demasiado largas" })
    .optional(),
});

export type CheckoutPayloadValidated = z.infer<typeof checkoutPayloadSchema>;

/**
 * Sensible defaults for `useForm({ defaultValues })`. All strings (never
 * undefined) so controlled inputs work cleanly from the first render.
 */
export const checkoutFormDefaults: CheckoutFormValues = {
  customer: { name: "", email: "", phone: "" },
  shipping: { address: "", canton_code: "", district: "", reference: "" },
  notes: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Payload (what gets POSTed to /api/checkout/session in Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape of the payload sent to the server checkout route, which the route
 * then forwards (after server-side re-validation) to the place_order RPC.
 *
 * Mirrors place_order(p_payload JSONB) exactly — snake_case throughout.
 */
export interface CheckoutPayload {
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    canton_code: string;
    canton_name: string;
    province_name: string;
    district?: string;
    reference?: string;
  };
  items: Array<{
    variant_id: string;
    quantity: number;
  }>;
  notes?: string;
}

/**
 * Build the API payload from validated form values + current cart contents.
 *
 *  - Derives canton_name + province_name from canton_code via the CR-geo dataset.
 *  - Strips empty optional strings to `undefined` so they JSON-serialize cleanly.
 *  - Lowercases email (matches what place_order RPC does internally — done
 *    here too so the client-side payload looks consistent in dev tools/logs).
 *
 * Throws if the form's canton_code isn't in the CR-geo dataset — this should
 * never happen because the form schema already validates via isValidCantonCode,
 * but we keep the defensive check so a bug in cr-geo accessors can't silently
 * send garbage to the server.
 */
export function buildCheckoutPayload(
  formValues: CheckoutFormValues,
  cartItems: CartLineItem[]
): CheckoutPayload {
  const canton = findCanton(formValues.shipping.canton_code);
  if (!canton) {
    throw new Error(
      `Internal error: unknown canton code "${formValues.shipping.canton_code}"`
    );
  }
  const province = findProvince(canton.provinceCode);
  if (!province) {
    throw new Error(
      `Internal error: unknown province for canton "${canton.code}"`
    );
  }

  const optional = (v: string): string | undefined =>
    v.trim() === "" ? undefined : v.trim();

  return {
    customer: {
      name: formValues.customer.name.trim(),
      email: formValues.customer.email.trim().toLowerCase(),
      phone: formValues.customer.phone.trim(),
    },
    shipping: {
      address: formValues.shipping.address.trim(),
      canton_code: canton.code,
      canton_name: canton.name,
      province_name: province.name,
      district: optional(formValues.shipping.district),
      reference: optional(formValues.shipping.reference),
    },
    items: cartItems.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
    })),
    notes: optional(formValues.notes),
  };
}
