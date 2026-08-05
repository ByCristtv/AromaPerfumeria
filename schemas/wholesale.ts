/**
 * Wholesale application validation.
 *
 * One schema, used in two places:
 *   1. react-hook-form on the client (WholesaleApplicationForm).
 *   2. Server-side re-validation inside the applyForWholesaleAction server
 *      action — the action is the trust boundary; the form is a convenience.
 */

import { z } from "zod";

export const wholesaleApplicationSchema = z.object({
  company_name: z
    .string()
    .trim()
    .min(2, { message: "Ingresa el nombre de tu empresa" })
    .max(120, { message: "Nombre de empresa demasiado largo" }),
  // Cédula Jurídica (CR) / RUC — kept liberal (digits, dashes, letters) so it
  // works across the region; the admin verifies it during review.
  tax_id: z
    .string()
    .trim()
    .min(8, { message: "Cédula jurídica / RUC inválido (mínimo 8 caracteres)" })
    .max(30, { message: "Cédula jurídica / RUC demasiado largo" }),
  business_activity: z
    .string()
    .trim()
    .min(2, { message: "Describe tu actividad comercial" })
    .max(200, { message: "Descripción demasiado larga" }),
  // Optional. Accepts an empty string (unfilled field) or a valid URL.
  website: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .url({ message: "Ingresa una URL válida (https://...)" })
        .max(200, { message: "URL demasiado larga" }),
    ])
    .optional(),
});

export type WholesaleApplicationFormValues = z.infer<
  typeof wholesaleApplicationSchema
>;

/** Empty defaults for `useForm({ defaultValues })` — all controlled strings. */
export const wholesaleApplicationDefaults: WholesaleApplicationFormValues = {
  company_name: "",
  tax_id: "",
  business_activity: "",
  website: "",
};
