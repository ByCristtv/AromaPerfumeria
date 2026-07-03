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

const items: { icon: LucideIcon; title: string; }[] = [
  { icon: ShieldCheck, title: "Fragancias 100% originales"},
  { icon: Truck, title: "Envíos a todo el país" },
  { icon: Lock, title: "Pagos con Tarjeta o SINPE"},
  { icon: Headset, title: "Asesoría personalizada"},
];

export default function TrustIndicators() {
  return (
    <section className="border-y border-white/8 bg-[#0a0a0a]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-white/6 lg:grid-cols-4">
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
                
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
