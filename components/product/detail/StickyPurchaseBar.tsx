"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

interface StickyPurchaseBarProps {
  productName: string;
  variantLabel: string;
  price: number;
  onAdd: () => void;
  disabled: boolean;
}

/**
 * Mobile-only sticky purchase bar. Appears once the user scrolls past the
 * fold and the primary CTA is no longer in view. Desktop keeps the main
 * CTA visible inside the sticky right column, so this bar is hidden ≥ md.
 */
export default function StickyPurchaseBar({
  productName,
  variantLabel,
  price,
  onAdd,
  disabled,
}: StickyPurchaseBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 560);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3"
        >
          <div
            className="flex items-center gap-3 rounded-full bg-white/95 backdrop-blur px-3 py-2.5"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow:
                "0 -10px 40px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,169,110,0.18)",
            }}
          >
            <div className="min-w-0 flex-1 pl-2">
              <p className="text-[11px] text-black/50 truncate">
                {productName}
              </p>
              <p className="text-sm font-semibold tabular-nums leading-tight">
                {formatPrice(price)}{" "}
                <span className="text-[11px] font-normal text-black/45">
                  · {variantLabel}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onAdd}
              disabled={disabled}
              className="px-5 py-2.5 text-[11px] font-semibold tracking-[0.18em] uppercase rounded-full text-white disabled:opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
                boxShadow:
                  "0 8px 22px -10px rgba(201,169,110,0.6), 0 0 0 1px rgba(201,169,110,0.3)",
              }}
            >
              {disabled ? "Agotado" : "Agregar"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
