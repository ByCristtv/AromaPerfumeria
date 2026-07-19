"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";

const SERIF = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";
const INPUT_CLS =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50";

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
    <section className="min-h-screen pt-28 pb-10 px-4 bg-[radial-gradient(circle_at_10%_10%,#222_0%,#111_45%,#000_100%)]">
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-[#c9a96e]/35 bg-black/65 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="inline-flex flex-col leading-none select-none">
              <span
                className="text-white tracking-[0.35em] text-3xl sm:text-4xl font-light"
                style={{ fontFamily: SERIF }}
              >
                AROMA
              </span>
              <span
                className="text-[#c9a96e] text-[11px] tracking-[0.25em] font-light italic mt-1"
                style={{ fontFamily: SERIF }}
              >
                Luxury Fragrance
              </span>
            </div>
            <h1 className="text-white text-xl sm:text-2xl font-semibold mt-6">
              Iniciar sesión
            </h1>
            <p className="text-white/70 text-sm mt-2">
              Accede a tu cuenta para gestionar pedidos y favoritos.
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
              className="w-full rounded-xl bg-[#c9a96e] py-3 text-sm font-medium text-black transition hover:bg-[#c9a96e]/90 disabled:opacity-50"
            >
              {submitting ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>

          <p className="text-center text-sm text-white/55 mb-5">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-[#c9a96e] hover:underline">
              Crear cuenta
            </Link>
          </p>

          <div className="flex items-center gap-3 mb-5">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wider text-white/40">
              o
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-black py-3.5 px-4 font-medium hover:bg-neutral-100 transition duration-200"
          >
            <GoogleIcon />
            Continuar con Google
          </button>

          <p className="text-center text-xs text-white/55 mt-5 leading-relaxed">
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
