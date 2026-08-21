"use client";

import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import PaymentMethodSelector from "./PaymentMethodSelector";
import {
  findCanton,
  getCantones,
  getProvinces,
} from "@/lib/cr-geo";
import type { CheckoutFormValues } from "@/schemas/checkout";

interface CheckoutFormProps {
  form: UseFormReturn<CheckoutFormValues>;
  onSubmit: (values: CheckoutFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

export default function CheckoutForm({
  form,
  onSubmit,
  isSubmitting,
}: CheckoutFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Province is local UI state — not in the form schema. Picking a province
  // filters the canton dropdown options.
  //
  // We derive the initial province from the form's canton_code (if defaults
  // include one — relevant once saved-address prefill lands). For runtime
  // changes, the user always picks province first → canton, so no effect-based
  // sync is needed. If we add programmatic canton resets later (e.g., "use my
  // saved address" button), revisit and pass the new province explicitly.
  const watchedCantonCode = watch("shipping.canton_code");
  const watchedPaymentMethod = watch("payment_method");

  // The province the user picked by hand. Authoritative ONLY while no cantón is
  // chosen yet — once a cantón exists, the province is implied by it.
  const [provinceOverride, setProvinceOverride] = useState("");

  // DERIVED during render, never stored, never synced in an effect.
  //
  // This is the fix for the saved-address prefill: `form.reset()` lands
  // canton_code="101", and on that SAME render the province — and therefore the
  // cantón <option> list — is already correct. The previous version derived the
  // province in an effect, so the options for the incoming cantón did not exist
  // yet when its value was applied, and the browser silently dropped it.
  const selectedProvince =
    findCanton(watchedCantonCode)?.provinceCode ?? provinceOverride;

  const provinces = getProvinces();
  const cantonesForProvince = getCantones(selectedProvince);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvinceOverride(e.target.value);
    // Drop the cantón — the previous one belongs to the old province. This also
    // hands control back to `provinceOverride` above, since the derived lookup
    // now misses.
    setValue("shipping.canton_code", "", { shouldValidate: false });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      {/* ──────── Contacto ──────── */}
      <Section title="Contacto" description="Para enviarte la confirmación y noticias de tu pedido." appearDelay={0}>
        <Field
          label="Nombre completo"
          required
          error={errors.customer?.name?.message}
        >
          <input
            type="text"
            autoComplete="name"
            {...register("customer.name")}
            className={inputClass(!!errors.customer?.name)}
            placeholder="María Pérez González"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Correo electrónico"
            required
            error={errors.customer?.email?.message}
          >
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              {...register("customer.email")}
              className={inputClass(!!errors.customer?.email)}
              placeholder="tu@correo.com"
            />
          </Field>

          <Field
            label="Teléfono"
            required
            error={errors.customer?.phone?.message}
          >
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              {...register("customer.phone")}
              className={inputClass(!!errors.customer?.phone)}
              placeholder="8888-8888"
            />
          </Field>
        </div>
      </Section>

      {/* ──────── Dirección de entrega ──────── */}
      <Section
        title="Dirección de entrega"
        description="Escribe señas claras — en Costa Rica las referencias son lo más importante."
        appearDelay={80}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Provincia" required>
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              className={inputClass(false)}
              autoComplete="address-level1"
            >
              <option value="">— Selecciona —</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Cantón"
            required
            error={errors.shipping?.canton_code?.message}
          >
            {/*
              CONTROLLED on purpose — do not switch back to `register()`.
              An uncontrolled <select> gets its value assigned by RHF's ref at
              reset() time; if the matching <option> isn't mounted yet the browser
              discards it, and React never reapplies it when the options arrive.
              Binding `value` makes React set it during the same commit that
              renders the options, which is what makes the prefill stick.
            */}
            <select
              name="shipping.canton_code"
              value={watchedCantonCode}
              onChange={(e) =>
                setValue("shipping.canton_code", e.target.value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              className={inputClass(!!errors.shipping?.canton_code)}
              autoComplete="address-level2"
              disabled={!selectedProvince}
            >
              <option value="">
                {selectedProvince
                  ? "— Selecciona —"
                  : "Selecciona la provincia primero"}
              </option>
              {cantonesForProvince.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Distrito"
          error={errors.shipping?.district?.message}
          required
        >
          <input
            type="text"
            autoComplete="address-level3"
            {...register("shipping.district")}
            className={inputClass(!!errors.shipping?.district)}
            placeholder="Ej. Carmen"
          />
        </Field>

        <Field
          label="Señas exactas"
          required
          error={errors.shipping?.address?.message}
          hint="Dirección descriptiva con puntos de referencia o sucursal de correos cercana"
        >
          <textarea
            rows={3}
            autoComplete="street-address"
            {...register("shipping.address")}
            className={inputClass(!!errors.shipping?.address) + " resize-none"}
            placeholder="200m sur de la iglesia católica, casa azul portón negro"
          />
        </Field>

        <Field
          label="Punto de referencia adicional"
          error={errors.shipping?.reference?.message}
          hint="Opcional"
        >
          <input
            type="text"
            {...register("shipping.reference")}
            className={inputClass(!!errors.shipping?.reference)}
            placeholder="Ej. Frente al parque"
          />
        </Field>
      </Section>

      {/* ──────── Notas ──────── */}
      <Section
        title="Notas para el pedido"
        description="¿Es un regalo? ¿Horario preferido para entrega? Cuéntanos."
        appearDelay={160}
      >
        <Field label="Notas" error={errors.notes?.message} hint="Opcional">
          <textarea
            rows={3}
            {...register("notes")}
            className={inputClass(!!errors.notes) + " resize-none"}
            placeholder="Ej. Es para regalo, no incluyas factura impresa"
          />
        </Field>
      </Section>

      {/* ──────── Método de pago ──────── */}
      <Section
        title="Método de pago"
        description="Elige cómo quieres pagar tu pedido."
        appearDelay={240}
      >
        <PaymentMethodSelector
          value={watchedPaymentMethod}
          onChange={(method) =>
            setValue("payment_method", method, { shouldValidate: true })
          }
        />
      </Section>

      {/* ──────── Submit ──────── */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-none bg-krov-blood text-krov-void py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Procesando…" : "Continuar al pago"}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline UI helpers — kept private to this file. If we end up reusing in other
// forms, extract to components/ui/Form.tsx then.
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
  appearDelay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  appearDelay?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), appearDelay);
    return () => clearTimeout(t);
  }, [appearDelay]);

  return (
    <section
      className={`rounded-none border border-krov-smoke bg-krov-coal p-5 sm:p-6 transform transition-opacity duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${appearDelay}ms` }}
    >
      <header className="mb-4">
        <h3 className="text-base font-semibold text-krov-bone">{title}</h3>
        {description && (
          <p className="text-xs text-krov-dust mt-0.5">{description}</p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  // Generate a deterministic-ish id from the label; sufficient since labels
  // are unique within a section. For repeated forms, switch to useId().
  const id = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label
          htmlFor={id}
          className="text-sm font-medium text-krov-bone"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {hint && (
          <span className="text-xs text-krov-dust">{hint}</span>
        )}
      </div>
      {/* Inject id + aria props into the child input/select/textarea */}
      {injectFieldProps(children, id, error)}
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-xs text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function injectFieldProps(
  child: React.ReactNode,
  id: string,
  error?: string
): React.ReactNode {
  if (!child || typeof child !== "object" || !("props" in child)) return child;
  const element = child as React.ReactElement<Record<string, unknown>>;
  return {
    ...element,
    props: {
      ...element.props,
      id,
      "aria-invalid": error ? "true" : undefined,
      "aria-describedby": error ? `${id}-error` : undefined,
    },
  };
}

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-none border bg-krov-coal px-3 py-2.5 text-sm text-krov-bone",
    "placeholder:text-krov-dust",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    hasError
      ? "border-red-500/50 focus:ring-red-500/40"
      : "border-krov-edge focus:ring-krov-blood/40",
    "disabled:bg-krov-void disabled:text-krov-dust disabled:cursor-not-allowed",
  ].join(" ");
}
