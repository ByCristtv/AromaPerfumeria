"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Mail, Send } from "lucide-react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Exclusive newsletter subscription block. Front-end capture only — validates
 * locally and shows a confirmation state (no backend list is wired yet).
 */
export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }
    setError(null);
    setDone(true);
  };

  return (
    <section className="border-y border-white/8 bg-[#0b0a09]">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p
            className="mb-4 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Membresía
          </p>
          <h2
            className="text-3xl leading-tight text-white md:text-4xl"
            style={{ fontFamily: serif }}
          >
            Únete al <span className="italic text-[#c9a96e]">Círculo Aroma</span>
          </h2>
          <p
            className="mt-4 max-w-md text-base leading-relaxed text-white/60"
            style={{ fontFamily: serif }}
          >
            Recibe lanzamientos exclusivos, recomendaciones personalizadas,
            novedades del mundo de la perfumería y promociones especiales.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {done ? (
            <div
              role="status"
              className="flex items-center gap-4 rounded-xl border border-[#c9a96e]/30 bg-[#c9a96e]/8 px-6 py-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/40 text-[#c9a96e]">
                <Check size={22} strokeWidth={1.5} aria-hidden />
              </span>
              <p className="text-white/80" style={{ fontFamily: serif }}>
                Bienvenido al Círculo Aroma. Pronto recibirás nuestras novedades
                más exclusivas.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Mail
                    size={17}
                    aria-hidden
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />
                  <label htmlFor="footer-newsletter-email" className="sr-only">
                    Correo electrónico
                  </label>
                  <input
                    id="footer-newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="tu@correo.com"
                    aria-invalid={!!error}
                    className={`w-full rounded-lg border bg-[#141312] py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition-colors duration-300 ${
                      error
                        ? "border-red-500/60 focus:border-red-500"
                        : "border-white/12 focus:border-[#c9a96e] focus:ring-1 focus:ring-[#c9a96e]/40"
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center gap-2 border border-[#c9a96e] bg-[#c9a96e] px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-black transition-all duration-500 hover:bg-transparent hover:text-[#c9a96e]"
                  style={{ fontFamily: serif }}
                >
                  Suscribirme
                  <Send
                    size={14}
                    aria-hidden
                    className="transition-transform duration-500 group-hover:translate-x-1"
                  />
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-400" role="alert">
                  {error}
                </p>
              )}
              <p className="mt-3 text-[11px] text-white/30" style={{ fontFamily: serif }}>
                Sin spam. Solo perfumería de alta gama. Cancela cuando quieras.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
