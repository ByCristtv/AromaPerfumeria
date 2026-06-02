"use client";

import { motion } from "framer-motion";

interface ProductHeaderProps {
  brand: string;
  name: string;
  gender: "masculine" | "feminine" | "unisex";
  concentration: string;
}

const GENDER_LABEL: Record<ProductHeaderProps["gender"], string> = {
  masculine: "Masculino",
  feminine: "Femenino",
  unisex: "Unisex",
};

export default function ProductHeader({
  brand,
  name,
  gender,
  concentration,
}: ProductHeaderProps) {
  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-[11px] font-medium tracking-[0.32em] uppercase"
        style={{ color: "#c9a96e" }}
      >
        {brand}
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 text-4xl sm:text-5xl font-light text-black leading-[1.05] tracking-tight"
        style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
      >
        {name}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="mt-5 flex items-center gap-3"
      >
        <Chip>{concentration}</Chip>
        <span className="h-px w-6 bg-black/15" />
        <Chip>{GENDER_LABEL[gender]}</Chip>
      </motion.div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center text-[11px] font-medium tracking-[0.18em] uppercase text-black/60 px-3 py-1.5 rounded-full"
      style={{
        border: "1px solid rgba(201,169,110,0.35)",
        background:
          "linear-gradient(180deg, rgba(201,169,110,0.06), rgba(201,169,110,0.02))",
      }}
    >
      {children}
    </span>
  );
}
