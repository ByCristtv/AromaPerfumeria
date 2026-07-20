"use client";

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
 * Mobile-only sticky purchase bar. Slides up once the user scrolls past the
 * fold, so the primary CTA is always one tap away. Desktop keeps the main CTA
 * visible in the sticky column, so this is hidden ≥ md.
 *
 * Performance notes (this bar is on screen precisely while the user scrolls, so
 * it must be cheap):
 *  - No Framer Motion. The show/hide is a plain CSS `translateY` transition —
 *    transform only, so it stays on the compositor and never triggers layout.
 *  - No `backdrop-blur`. A blurred backdrop re-samples the content scrolling
 *    behind it every single frame, which is one of the worst offenders for
 *    scroll FPS on low-end Android. The bar is fully opaque instead.
 *  - Always mounted, moved off-screen when hidden — avoids mount/unmount churn.
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

  // While the bar is on screen, lift the Navbar's floating cart clear of it via
  // a root class (decoupled — no shared React state). Scoped to the viewport
  // where the bar actually renders (matches the `md:hidden` below) so the cart
  // never shifts on tablet/desktop where the bar is hidden.
  useEffect(() => {
    const root = document.documentElement;
    const onMobile = window.matchMedia("(max-width: 767px)").matches;
    root.classList.toggle("purchase-bar-open", visible && onMobile);
    return () => root.classList.remove("purchase-bar-open");
  }, [visible]);

  return (
    <div
      aria-hidden={!visible}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-[130%] pointer-events-none"
      }`}
    >
      <div
        className="flex items-center gap-3 rounded-full bg-white px-3 py-2.5"
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow:
            "0 -10px 40px -20px rgba(0,0,0,0.18), 0 0 0 1px rgba(201,169,110,0.18)",
        }}
      >
        <div className="min-w-0 flex-1 pl-2">
          <p className="text-[11px] text-black/50 truncate">{productName}</p>
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
            background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
            boxShadow:
              "0 8px 22px -10px rgba(201,169,110,0.6), 0 0 0 1px rgba(201,169,110,0.3)",
          }}
        >
          {disabled ? "Agotado" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
