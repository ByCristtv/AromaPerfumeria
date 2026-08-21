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
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0" : "translate-y-[130%] pointer-events-none"
      }`}
    >
      {/* Squared and flush to the screen edges rather than a floating pill: at
          the foot of a phone this bar IS the base of the layout, and a pill
          hovering above the home indicator wastes the safest tap zone there is.
          The CTA keeps a 48px height so it clears the touch-target minimum with
          room to spare. */}
      <div className="flex items-center gap-3 border-t border-krov-smoke bg-krov-coal px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-krov-dust">
            {productName}
          </p>
          <p className="text-sm leading-tight tabular-nums text-krov-bone">
            {formatPrice(price)}{" "}
            <span className="text-[10px] text-krov-dust">· {variantLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="shrink-0 bg-krov-blood px-6 py-3.5 text-[10px] uppercase tracking-[0.2em] text-krov-void transition-colors disabled:bg-krov-graphite disabled:text-krov-dust"
        >
          {disabled ? "Agotado" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
