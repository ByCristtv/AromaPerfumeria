"use client";

import { motion } from "framer-motion";
import {
  Headset,
  ShieldCheck,
  Truck,
  Lock,
  type LucideIcon,
} from "lucide-react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const items: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: ShieldCheck, title: "Fragancias auténticas", desc: "100% originales y seleccionadas" },
  { icon: Truck, title: "Envíos a todo el país", desc: "Entregas rápidas y seguras" },
  { icon: Lock, title: "Pagos seguros", desc: "Tarjeta o SINPE Móvil" },
  { icon: Headset, title: "Atención premium", desc: "Asesoría personalizada" },
];

export default function TrustIndicators() {
  return (
    <section className="border-y border-white/8 bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/[0.06] lg:grid-cols-4">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4 bg-[#0a0a0a] px-6 py-8 transition-colors duration-500 hover:bg-[#0e0e0e]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#c9a96e]/40 text-[#c9a96e]">
                <Icon size={20} strokeWidth={1.4} aria-hidden />
              </span>
              <div>
                <p className="text-base text-white" style={{ fontFamily: serif }}>
                  {item.title}
                </p>
                <p className="text-xs text-white/45" style={{ fontFamily: serif }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
