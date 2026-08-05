"use client";

import Link from "next/link";
import { useCart } from "@/hooks/useCart";
import { useCartPricing } from "@/hooks/useCartPricing";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useShippingPreview } from "@/hooks/useShippingPreview";
import { formatPrice } from "@/lib/format";

interface OrderSummaryProps {
  /**
   * Selected canton code from the checkout form. Optional — when undefined,
   * the shipping line shows a "pick a canton" hint instead of a calculated cost.
   */
  cantonCode: string | undefined;
}

export default function OrderSummary({ cantonCode }: OrderSummaryProps) {
  // Zustand cart persists in localStorage. SSR renders empty, client hydrates
  // with the real cart → guard against the hydration mismatch.
  const mounted = useIsMounted();
  const { cart, totalItems } = useCart();

  // Wholesale-aware subtotal drives the shipping preview + free-shipping
  // threshold so they match what place_order will compute server-side.
  const { pricing } = useCartPricing(cart);
  const goodsSubtotal = pricing.subtotal;

  const {
    data: shipping,
    isLoading: shippingLoading,
    isError: shippingError,
  } = useShippingPreview({
    canton_code: cantonCode,
    subtotal: goodsSubtotal,
    enabled: mounted && cart.length > 0,
  });

  if (!mounted) return null;

  // ──────── Empty cart ────────
  if (cart.length === 0) {
    return (
      <aside className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
        <p className="text-sm text-gray-600">Tu carrito está vacío.</p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm font-medium text-black underline"
        >
          Seguir comprando
        </Link>
      </aside>
    );
  }

  const shippingCost = shipping?.cost ?? 0;
  const total = goodsSubtotal + shippingCost;
  const thresholdRemaining =
    shipping?.free_shipping_threshold != null &&
    !shipping.free_shipping_applied
      ? shipping.free_shipping_threshold - goodsSubtotal
      : 0;

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 h-fit lg:sticky lg:top-28">
      <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
      <p className="text-xs text-gray-500 mt-0.5">
        {totalItems} {totalItems === 1 ? "producto" : "productos"}
      </p>

      {/* ──────── Items list ──────── */}
      <ul className="mt-4 space-y-2 text-sm border-b border-gray-100 pb-4">
        {cart.map((item) => {
          const line = pricing.lines[item.variant_id];
          const lineTotal = line?.lineTotal ?? item.price * item.quantity;
          return (
            <li
              key={item.variant_id}
              className="flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-gray-900 truncate">{item.product_name}</p>
                <p className="text-xs text-gray-500">
                  {item.size_ml} ml · cant. {item.quantity}
                  {line?.wasWholesale && (
                    <span className="ml-2 rounded bg-[#c9a96e]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8a6d3b]">
                      Mayorista
                    </span>
                  )}
                </p>
              </div>
              <span className="text-gray-900 shrink-0 tabular-nums">
                {formatPrice(lineTotal)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* ──────── Totals ──────── */}
      <dl className="mt-4 space-y-2 text-sm">
        {pricing.hasWholesaleApplied && (
          <div className="flex items-center justify-between text-[#8a6d3b]">
            <dt>Ahorro mayorista</dt>
            <dd className="tabular-nums">−{formatPrice(pricing.wholesaleSavings)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between text-gray-600">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(goodsSubtotal)}</dd>
        </div>

        <div className="flex items-center justify-between text-gray-600">
          <dt>Envío</dt>
          <dd className="tabular-nums text-right">
            {renderShippingValue({
              cantonCode,
              shipping,
              loading: shippingLoading,
              error: shippingError,
            })}
          </dd>
        </div>

        {thresholdRemaining > 0 && (
          <p className="text-xs text-emerald-700 bg-emerald-50 rounded-md px-3 py-2 leading-snug">
            Te faltan <strong>{formatPrice(thresholdRemaining)}</strong> para
            envío gratis en {shipping?.zone_name}.
          </p>
        )}

        <div className="flex items-center justify-between text-base font-semibold text-gray-900 pt-3 border-t border-gray-200">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPrice(total)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-gray-500 leading-relaxed">
        Precios incluyen IVA. El envío se confirma con el cantón seleccionado.
      </p>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

interface RenderShippingArgs {
  cantonCode: string | undefined;
  shipping: { cost: number; zone_name: string; free_shipping_applied: boolean } | undefined;
  loading: boolean;
  error: boolean;
}

function renderShippingValue({
  cantonCode,
  shipping,
  loading,
  error,
}: RenderShippingArgs) {
  if (!cantonCode) {
    return (
      <span className="text-xs text-gray-400">Selecciona un cantón</span>
    );
  }
  if (loading && !shipping) {
    return <span className="text-xs text-gray-400">Calculando…</span>;
  }
  if (error) {
    return (
      <span className="text-xs text-red-600">Error al calcular envío</span>
    );
  }
  if (!shipping) return null;

  if (shipping.free_shipping_applied) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold uppercase tracking-wide">
          Gratis
        </span>
      </span>
    );
  }

  return <>{formatPrice(shipping.cost)}</>;
}
