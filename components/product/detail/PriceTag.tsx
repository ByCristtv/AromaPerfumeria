"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatPrice } from "@/lib/format";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  onOffer: boolean;
}

/**
 * The price is set in the display serif at headline scale — on this page it is
 * the second-largest thing after the product's name, which is the hierarchy a
 * buying decision actually has.
 *
 * The number animates on change because it genuinely changes: selecting a
 * different size swaps it, and the swap needs to be noticed.
 */
export default function PriceTag({
  price,
  originalPrice,
  onOffer,
}: PriceTagProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <AnimatePresence mode="wait">
        <motion.span
          key={price}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl tabular-nums leading-none text-krov-bone"
          style={{ fontFamily: serif }}
        >
          {formatPrice(price)}
        </motion.span>
      </AnimatePresence>

      {onOffer && originalPrice != null && originalPrice > price && (
        <span className="mb-1 text-sm tabular-nums text-krov-dust line-through">
          {formatPrice(originalPrice)}
        </span>
      )}

      {onOffer && (
        <span className="mb-1.5 bg-krov-blood px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-krov-void">
          Oferta
        </span>
      )}
    </div>
  );
}
