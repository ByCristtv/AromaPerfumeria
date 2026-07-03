"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";

const serif =
  "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const inputClass =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50";

/**
 * Manual registration form (email + password + full name).
 *
 * On submit we call Supabase Auth `signUp`, passing `full_name` in
 * `options.data`. That lands in `auth.users.raw_user_meta_data`, and the
 * existing `handle_new_user` trigger copies it into `public.profiles` with the
 * default role 'customer' — so no extra client write (and no service-role key)
 * is needed to seed the profile.
 *
 * Supabase may be configured to require email confirmation. We detect both
 * outcomes: an immediate session (confirmation off → straight to the account)
 * or no session (confirmation on → show a "check your inbox" panel).
 */
export default function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError("");

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setServerError(translateAuthError(error.message));
      return;
    }

    // Session present → confirmation disabled; the trigger already created the
    // profile. Forward to the account view.
    if (data.session) {
      router.replace("/login");
      router.refresh();
      return;
    }

    // No session → email confirmation required.
    setEmailSent(true);
  });

  if (emailSent) {
    return (
      <Card>
        <h1
          className="text-white text-xl sm:text-2xl font-semibold"
          style={{ fontFamily: serif }}
        >
          Revisa tu correo
        </h1>
        <p className="mt-3 text-sm text-white/70">
          Te enviamos un enlace de confirmación. Ábrelo para activar tu cuenta y
          luego inicia sesión.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#c9a96e] py-3 text-sm font-medium text-black transition hover:bg-[#c9a96e]/90"
        >
          Ir a iniciar sesión
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-center mb-7">
        <Brand />
        <h1 className="text-white text-xl sm:text-2xl font-semibold mt-6">
          Crear cuenta
        </h1>
        <p className="text-white/70 text-sm mt-2">
          Regístrate para gestionar tus pedidos y favoritos.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Nombre completo" error={errors.fullName?.message}>
          <input
            type="text"
            autoComplete="name"
            placeholder="Juana Pérez"
            className={inputClass}
            {...register("fullName")}
          />
        </Field>

        <Field label="Correo electrónico" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            className={inputClass}
            {...register("email")}
          />
        </Field>

        <Field label="Contraseña" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirmar contraseña"
          error={errors.confirmPassword?.message}
        >
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            className={inputClass}
            {...register("confirmPassword")}
          />
        </Field>

        {serverError && <p className="text-xs text-red-400">{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#c9a96e] py-3 text-sm font-medium text-black transition hover:bg-[#c9a96e]/90 disabled:opacity-50"
        >
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-white/55 mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-[#c9a96e] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}

/** Map common Supabase auth error strings to friendly Spanish copy. */
function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ese correo ya está registrado. Intenta iniciar sesión.";
  }
  if (m.includes("password")) {
    return "La contraseña no cumple los requisitos.";
  }
  return "No pudimos crear la cuenta. Inténtalo de nuevo.";
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen pt-28 pb-10 px-4 bg-[radial-gradient(circle_at_10%_10%,#222_0%,#111_45%,#000_100%)]">
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-[#c9a96e]/35 bg-black/65 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8">
          {children}
        </div>
      </div>
    </section>
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
      <label className="text-white/60 text-xs mb-1 block">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Brand() {
  return (
    <div className="inline-flex flex-col leading-none select-none">
      <span
        className="text-white tracking-[0.35em] text-3xl sm:text-4xl font-light"
        style={{ fontFamily: serif }}
      >
        AROMA
      </span>
      <span
        className="text-[#c9a96e] text-[11px] tracking-[0.25em] font-light italic mt-1"
        style={{ fontFamily: serif }}
      >
        Luxury Fragrance
      </span>
    </div>
  );
}
