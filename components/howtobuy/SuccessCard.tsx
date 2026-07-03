"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, Smartphone, Sparkles } from "lucide-react";
import ImagePlaceholder from "./ImagePlaceholder";
import { fadeUp, serif, stagger } from "./styles";

const notes = [
  {
    icon: CreditCard,
    title: "Pago con tarjeta",
    desc: "Se marca como pagado automáticamente y se refleja en tu cuenta de inmediato.",
  },
  {
    icon: Smartphone,
    title: "Pago con SINPE Móvil",
    desc: "Se verifica manualmente tras recibir tu comprobante y el estado del pedido se actualiza en consecuencia.",
  },
];

/** Closing celebration card that reinforces confidence and the luxury feel. */
export default function SuccessCard() {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      aria-labelledby="success-title"
      className="relative overflow-hidden rounded-[2rem] border border-[#c9a96e]/25 bg-gradient-to-b from-[#121110] to-[#0a0a0a] p-7 shadow-[0_60px_140px_-60px_rgba(201,169,110,0.4)] sm:p-12"
    >
      {/* Ambient gold aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#c9a96e]/10 blur-[100px]"
      />

      <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <motion.div variants={fadeUp} className="order-2 lg:order-1">
          <span className="mb-7 inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96e]/40 bg-[#c9a96e]/10 text-[#c9a96e]">
            <Sparkles size={26} strokeWidth={1.3} aria-hidden="true" />
          </span>

          <p
            className="mb-4 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Disfruta tu fragancia
          </p>
          <h2
            id="success-title"
            className="mb-5 text-3xl leading-tight text-white md:text-5xl"
            style={{ fontFamily: serif }}
          >
            Tu pedido está <span className="italic text-[#c9a96e]">completo</span>
          </h2>
          <p
            className="mb-8 max-w-md text-base leading-relaxed text-white/65 md:text-lg"
            style={{ fontFamily: serif }}
          >
            Gracias por confiar en Aroma Perfumería. Prepararemos tu fragancia con
            el cuidado que merece.
          </p>

          <ul className="mb-9 space-y-4">
            {notes.map((n) => {
              const Icon = n.icon;
              return (
                <li key={n.title} className="flex gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/30 text-[#c9a96e]">
                    <Icon size={18} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                  <div>
                    <p
                      className="text-white"
                      style={{ fontFamily: serif, fontSize: "1.05rem" }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-sm leading-relaxed text-white/55"
                      style={{ fontFamily: serif }}
                    >
                      {n.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <Link
            href="/products"
            aria-label="Explorar la colección de perfumes"
            className="inline-block border border-[#c9a96e] bg-[#c9a96e] px-10 py-4 text-sm uppercase tracking-[0.25em] text-black transition-all duration-500 hover:bg-transparent hover:text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            Explorar colección
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} className="order-1 lg:order-2">
          <ImagePlaceholder
            number={11}
            showBadge={false}
            alt="Empaque de fragancia de lujo o ilustración de pedido completado"
            label="Empaque premium / Pedido completado"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
