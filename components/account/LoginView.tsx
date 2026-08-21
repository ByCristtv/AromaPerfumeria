"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import KrovLogo from "@/components/brand/KrovLogo";

const SERIF = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";
const INPUT_CLS =
  "w-full border border-krov-edge bg-krov-graphite px-4 py-3 text-sm text-krov-bone placeholder:text-krov-dust transition-colors focus:border-krov-blood focus:outline-none";

/**
 * /login — authentication only.
 *
 * Previously this and the account dashboard were one component, which is why a
 * signed-in user's data lived at /login. Now this route does one thing, and an
 * already-authenticated visitor is sent to /profile.
 */
export default function LoginView() {
  const router = useRouter();
  const { user, isLoading } = useAuthUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already signed in → nothing to do here. `replace` keeps Back from ping-ponging
  // between /login and /profile. This also covers the post-sign-in transition:
  // onAuthStateChange updates useAuthUser, which re-runs this effect.
  useEffect(() => {
    if (!isLoading && user) router.replace("/profile");
  }, [isLoading, user, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) setError("Correo o contraseña incorrectos.");
      // On success the redirect effect above takes over.
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) console.error("[login] google oauth failed", error);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-krov-void px-5 pb-16 pt-28">
      <div
        aria-hidden
        className="krov-aura-wine pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 opacity-70"
      />
      <div className="relative mx-auto max-w-md">
        <div className="border border-krov-smoke bg-krov-coal p-7 sm:p-9">
          <div className="mb-9 text-center">
            {/* The official mark, not a type approximation. The old lockup
                set "AROMA" as letterspaced text with an italic tagline under
                it — a wordmark redrawn in CSS, which is exactly what a brand
                asset exists to prevent. */}
            <Link href="/" aria-label="KROV Perfumería — inicio">
              <KrovLogo tone="light" width={150} />
            </Link>
            <h1
              className="mt-8 text-3xl text-krov-bone"
              style={{ fontFamily: SERIF }}
            >
              Volvé a entrar
            </h1>
            <p className="mt-3 text-sm text-krov-ash">
              Tus pedidos, tus direcciones y tu historial te esperan.
            </p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-3 mb-5" noValidate>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              className={INPUT_CLS}
            />
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className={INPUT_CLS}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="krov-btn-primary w-full"
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="mb-5 text-center text-sm text-krov-ash">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-krov-rose underline-offset-4 hover:underline">
              Crear cuenta
            </Link>
          </p>

          <div className="flex items-center gap-3 mb-5">
            <span className="h-px flex-1 bg-krov-smoke" />
            <span className="text-[10px] uppercase tracking-[0.24em] text-krov-dust">
              o
            </span>
            <span className="h-px flex-1 bg-krov-smoke" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 border border-krov-edge px-4 py-3.5 text-[11px] uppercase tracking-[0.2em] text-krov-bone transition-colors duration-300 hover:border-krov-blood hover:text-krov-rose"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="mt-6 text-center text-xs leading-relaxed text-krov-dust">
            Al continuar, aceptas nuestros términos y condiciones.
          </p>
        </div>
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12 9.6 9.6 0 0 0 12 21.6c5.5 0 9.1-3.9 9.1-9.3 0-.6 0-1.1-.1-1.5H12Z"
      />
      <path
        fill="#34A853"
        d="M2.4 7.9l3.2 2.4C6.5 8.5 9 6 12 6c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.5 7.5l-1.1.4Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.6 0 4.8-.9 6.5-2.4l-3-2.4c-.8.6-2 1.1-3.5 1.1-3 0-5.5-2-6.4-4.7l-3.1 2.4A9.6 9.6 0 0 0 12 21.6Z"
      />
      <path
        fill="#4285F4"
        d="M21.1 10.5H12v3.9h5.5c-.3 1.2-1.1 2.2-2 2.9l3 2.4c1.8-1.6 2.6-4 2.6-7.1 0-.6 0-1.1-.1-1.5Z"
      />
    </svg>
  );
}
