"use client";

import { formatPrice } from "@/lib/format";

interface WholesalePanelProps {
  /** Wholesale unit price for the selected variant. */
  wholesalePrice: number;
  /** Units required to unlock the wholesale price. */
  minQuantity: number;
  /** Whether the current quantity already qualifies for wholesale. */
  active: boolean;
  /** How many more units are needed to unlock wholesale (0 when active). */
  unitsToUnlock: number;
}

/**
 * B2B pricing callout shown to approved wholesale buyers on the product page.
 * Surfaces the two numbers a wholesale buyer needs at a glance — the wholesale
 * unit price and the minimum quantity — plus a live status line telling them
 * whether the current quantity already qualifies. Retail pricing stays visible
 * above (this panel supplements, never replaces it).
 *
 * Marked out by a red rule down its left edge rather than by a tinted box: this
 * is an aside addressed to one kind of visitor, and it should read as a margin
 * note against the main panel, not as a competing surface.
 */
export default function WholesalePanel({
  wholesalePrice,
  minQuantity,
  active,
  unitsToUnlock,
}: WholesalePanelProps) {
  return (
    <div className="border-l-2 border-krov-blood bg-krov-blood/[0.06] py-4 pl-5 pr-4">
      <p className="text-[10px] uppercase tracking-[0.28em] text-krov-rose">
        Tu precio mayorista
      </p>

      <dl className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-krov-dust">
            Por unidad
          </dt>
          <dd className="mt-1 text-2xl tabular-nums text-krov-blush">
            {formatPrice(wholesalePrice)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-krov-dust">
            Cantidad mínima
          </dt>
          <dd className="mt-1 text-2xl tabular-nums text-krov-bone">
            {minQuantity}
            <span className="ml-1.5 text-[11px] text-krov-dust">
              {minQuantity === 1 ? "unidad" : "unidades"}
            </span>
          </dd>
        </div>
      </dl>

      <p
        className="mt-4 flex items-center gap-2 text-xs text-krov-ash"
        aria-live="polite"
      >
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            active ? "bg-krov-blood krov-pulse" : "bg-krov-dust"
          }`}
        />
        {active
          ? "Precio mayorista activo en tu cantidad actual"
          : `Agregá ${unitsToUnlock} ${
              unitsToUnlock === 1 ? "unidad más" : "unidades más"
            } para activarlo`}
      </p>
    </div>
  );
}
