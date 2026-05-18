"use client";

import Image from "next/image";
import { CartLineItem } from "@/types/product";

type CartItemProps = {
    item: CartLineItem;
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
    onIncrease,
    onDecrease,
    onDelete,
}: CartItemProps) {
    // Extraemos todo de la estructura plana del Store
    const { 
        variant_id, 
        product_name, 
        product_type, 
        size_ml, 
        price, 
        image_url, 
        quantity 
    } = item;

    const subtotal = price * quantity;

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
                            <p className="text-xs text-indigo-600 font-medium">
                                {size_ml}ml - {product_type === 'full_size' ? 'Frasco Original' : 'Decant'}
                            </p>
                        </div>
                        <button
                            onClick={() => onDelete(variant_id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                            Eliminar
                        </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50">
                            <button
                                onClick={() => onDecrease(variant_id)}
                                className="h-8 w-8 text-lg hover:bg-gray-200 rounded-l-lg transition"
                            >
                                -
                            </button>
                            <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                            <button
                                onClick={() => onIncrease(variant_id)}
                                className="h-8 w-8 text-lg hover:bg-gray-200 rounded-r-lg transition"
                            >
                                +
                            </button>
                        </div>

                        <div className="text-right ml-auto">
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="text-sm sm:text-base font-bold text-gray-900">
                                {formatPrice(subtotal)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}