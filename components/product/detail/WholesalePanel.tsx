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
 */
export default function WholesalePanel({
  wholesalePrice,
  minQuantity,
  active,
  unitsToUnlock,
}: WholesalePanelProps) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        border: "1px solid rgba(201,169,110,0.35)",
        background:
          "linear-gradient(180deg, rgba(201,169,110,0.10), rgba(201,169,110,0.03))",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.18em] uppercase"
          style={{
            color: "#7a5e2e",
            background: "rgba(201,169,110,0.18)",
            border: "1px solid rgba(201,169,110,0.4)",
          }}
        >
          Mayorista
        </span>
        <p className="text-[11px] tracking-[0.14em] uppercase text-black/45">
          Tu precio B2B
        </p>
      </div>

      <dl className="mt-3 flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <dt className="text-[11px] tracking-[0.14em] uppercase text-black/45">
            Precio mayorista
          </dt>
          <dd
            className="mt-1 text-2xl font-semibold tabular-nums"
            style={{ color: "#8a7341" }}
          >
            {formatPrice(wholesalePrice)}
            <span className="ml-1 text-[11px] font-normal text-black/45">
              / unidad
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.14em] uppercase text-black/45">
            Cantidad mínima
          </dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-black">
            {minQuantity}
            <span className="ml-1 text-[11px] font-normal text-black/45">
              {minQuantity === 1 ? "unidad" : "unidades"}
            </span>
          </dd>
        </div>
      </dl>

      <p
        className="mt-3 flex items-center gap-2 text-[12px] font-medium"
        style={{ color: active ? "#166534" : "#7a5e2e" }}
        aria-live="polite"
      >
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: active ? "#166534" : "#c9a96e" }}
        />
        {active
          ? "Precio mayorista activo en tu cantidad actual"
          : `Agrega ${unitsToUnlock} ${
              unitsToUnlock === 1 ? "unidad más" : "unidades más"
            } para el precio mayorista`}
      </p>
    </div>
  );
}
