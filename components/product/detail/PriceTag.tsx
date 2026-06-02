"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  onOffer: boolean;
}

export default function PriceTag({
  price,
  originalPrice,
  onOffer,
}: PriceTagProps) {
  return (
    <div className="flex items-end gap-3">
      <AnimatePresence mode="wait">
        <motion.span
          key={price}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl font-light tracking-tight text-black tabular-nums"
          style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
        >
          {formatPrice(price)}
        </motion.span>
      </AnimatePresence>

      {onOffer && originalPrice != null && originalPrice > price && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-base text-black/40 line-through tabular-nums mb-1"
        >
          {formatPrice(originalPrice)}
        </motion.span>
      )}

      {onOffer && (
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="mb-1 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] uppercase rounded-sm"
          style={{
            color: "#7a5e2e",
            background: "rgba(201,169,110,0.15)",
            border: "1px solid rgba(201,169,110,0.35)",
          }}
        >
          Oferta
        </motion.span>
      )}
    </div>
  );
}
