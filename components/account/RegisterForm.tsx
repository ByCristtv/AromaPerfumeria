"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import KrovLogo from "@/components/brand/KrovLogo";

const serif =
  "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

const inputClass =
  "w-full border border-krov-edge bg-krov-graphite px-4 py-3 text-sm text-krov-bone placeholder:text-krov-dust transition-colors focus:border-krov-blood focus:outline-none";

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
          className="krov-btn-primary mt-7 w-full"
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
          className="krov-btn-primary w-full"
        >
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="text-center text-sm text-white/55 mt-6">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-krov-rose hover:underline">
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
    <section className="relative min-h-screen overflow-hidden bg-krov-void px-5 pb-16 pt-28">
      <div
        aria-hidden
        className="krov-aura-wine pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 opacity-70"
      />
      <div className="relative mx-auto max-w-md">
        <div className="border border-krov-smoke bg-krov-coal p-7 sm:p-9">
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
      <label className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-krov-ash">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function Brand() {
  // The official mark, never type. See KrovLogo for why the CSS-drawn
  // "AROMA" lockup this replaced was a problem rather than a shortcut.
  return (
    <Link href="/" aria-label="KROV Perfumería — inicio">
      <KrovLogo tone="light" width={150} />
    </Link>
  );
}
