"use client";

import Image from "next/image";
import { CartLineItem } from "@/types/product";
import type { LinePricing } from "@/lib/pricing/wholesale";

type CartItemProps = {
    item: CartLineItem;
    /** Wholesale-aware pricing for this line. Falls back to retail when absent. */
    line?: LinePricing;
    onIncrease: (variantId: string) => void;
    onDecrease: (variantId: string) => void;
    onDelete: (variantId: string) => void;
};

function formatPrice(value: number) {
    return value.toLocaleString("es-CR", {
        style: "currency",
        currency: "CRC",
        maximumFractionDigits: 0,
    });
}

export default function CartItem({
    item,
    line,
    onIncrease,
    onDecrease,
    onDelete,
}: CartItemProps) {
    const {
        variant_id,
        product_name,
        product_type,
        size_ml,
        price,
        image_url,
        quantity,
    } = item;

    // Prefer the wholesale-aware pricing; fall back to the retail price baked
    // into the cart line (guests, or before the pricing fetch resolves).
    const unitPrice = line?.unitPrice ?? price;
    const subtotal = line?.lineTotal ?? price * quantity;
    const isWholesale = line?.wasWholesale ?? false;
    const unitsToUnlock = line?.unitsToUnlock ?? null;
    // Eligible buyer + variant set up for wholesale, but this line is still at
    // the standard price (below the minimum). `wholesaleConfigured` is only true
    // on the eligible path, so retail buyers never see the wholesale badges.
    const wholesaleConfigured = line?.wholesaleConfigured ?? false;
    const wholesalePrice = line?.wholesalePrice ?? null;

    return (
        <article className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
            <div className="flex gap-3 sm:gap-4">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg bg-gray-50 overflow-hidden border">
                    <Image src={image_url} alt={product_name} fill sizes="100%" className="object-contain p-1" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">
                                {product_name}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {size_ml}ml - {product_type === 'full_size' ? 'Frasco Original' : 'Decant'}
                            </p>
                            {isWholesale && (
                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                                    ✓ Precio mayorista aplicado
                                </span>
                            )}
                            {!isWholesale && wholesaleConfigured && (
                                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                                    Precio estándar
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => onDelete(variant_id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Eliminar
                        </button>
                    </div>

                    {/* Wholesale unlock progress — only shown for eligible buyers below the minimum. */}
                    {unitsToUnlock !== null && unitsToUnlock > 0 && (
                        <p className="mt-2 rounded-md bg-[#c9a96e]/10 px-2.5 py-1.5 text-[11px] leading-snug text-[#8a6d3b]">
                            Agrega <strong>{unitsToUnlock}</strong>{" "}
                            {unitsToUnlock === 1 ? "unidad" : "unidades"} más de{" "}
                            <strong>{product_name}</strong> para desbloquear el precio
                            mayorista
                            {wholesalePrice != null && <> de {formatPrice(wholesalePrice)}</>}.
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
                            <button
                                onClick={() => onDecrease(variant_id)}
                                className="h-8 w-8 text-lg hover:bg-gray-200 rounded-l-lg transition"
                                aria-label="Disminuir cantidad"
                            >
                                -
                            </button>
                            <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                            <button
                                onClick={() => onIncrease(variant_id)}
                                className="h-8 w-8 text-lg hover:bg-gray-200 rounded-r-lg transition"
                                aria-label="Aumentar cantidad"
                            >
                                +
                            </button>
                        </div>

                        <div className="text-right ml-auto">
                            {/* When wholesale applied, show the retail unit price struck through. */}
                            {isWholesale && line && (
                                <p className="text-[11px] text-gray-400 line-through tabular-nums">
                                    {formatPrice(line.retailPrice)} c/u
                                </p>
                            )}
                            <p className="text-[11px] text-gray-400 tabular-nums">
                                {formatPrice(unitPrice)} c/u
                            </p>
                            <p className="text-sm sm:text-base font-bold text-gray-900 tabular-nums">
                                {formatPrice(subtotal)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
