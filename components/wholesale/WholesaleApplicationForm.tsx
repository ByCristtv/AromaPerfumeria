"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import { useQueryClient } from "@tanstack/react-query";
import { applyForWholesaleAction } from "@/app/wholesale/actions";
import {
  wholesaleApplicationDefaults,
  wholesaleApplicationSchema,
  type WholesaleApplicationFormValues,
} from "@/schemas/wholesale";
import { WHOLESALE_STATUS_QUERY_KEY } from "@/hooks/useWholesaleStatus";

const SERIF = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const INPUT_CLS =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#c9a96e]/60 focus:border-[#c9a96e]/60";

/**
 * Wholesale account request form. Validated with the shared zod schema; the
 * server action re-validates and enforces the role/dedupe rules. Success/failure
 * surface as SweetAlert toasts (the app's convention).
 */
export default function WholesaleApplicationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WholesaleApplicationFormValues>({
    resolver: zodResolver(wholesaleApplicationSchema),
    defaultValues: wholesaleApplicationDefaults,
    mode: "onBlur",
  });

  const onSubmit = async (values: WholesaleApplicationFormValues) => {
    const result = await applyForWholesaleAction(values);

    if (!result.ok) {
      await Swal.fire({
        icon: "error",
        title: "No pudimos enviar tu solicitud",
        text: result.message,
        confirmButtonColor: "#c9a96e",
      });
      return;
    }

    // Refresh the cached eligibility so /profile shows the new status immediately.
    await queryClient.invalidateQueries({ queryKey: WHOLESALE_STATUS_QUERY_KEY });

    await Swal.fire({
      icon: "success",
      title: "¡Solicitud enviada!",
      text: result.message,
      confirmButtonColor: "#c9a96e",
    });
    router.push("/profile");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <Field label="Nombre de la empresa" error={errors.company_name?.message}>
        <input
          type="text"
          autoComplete="organization"
          placeholder="Ej. Perfumería Aurora S.A."
          className={INPUT_CLS}
          {...register("company_name")}
        />
      </Field>

      <Field
        label="Cédula jurídica / RUC"
        error={errors.tax_id?.message}
      >
        <input
          type="text"
          inputMode="text"
          placeholder="Ej. 3-101-123456"
          className={INPUT_CLS}
          {...register("tax_id")}
        />
      </Field>

      <Field label="Actividad comercial" error={errors.business_activity?.message}>
        <textarea
          rows={3}
          placeholder="Ej. Venta al detalle de perfumería y cosméticos"
          className={`${INPUT_CLS} resize-none`}
          {...register("business_activity")}
        />
      </Field>

      <Field
        label="Sitio web (opcional)"
        error={errors.website?.message}
      >
        <input
          type="url"
          inputMode="url"
          placeholder="https://tuempresa.com"
          className={INPUT_CLS}
          {...register("website")}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#c9a96e] py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-[#c9a96e]/90 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ fontFamily: SERIF }}
      >
        {isSubmitting ? "Enviando…" : "Enviar solicitud"}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-white/40">
        Revisaremos tu solicitud manualmente. Te notificaremos el resultado en tu
        perfil.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-white/55">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}
