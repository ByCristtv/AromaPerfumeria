"use client";

import Link from "next/link";
import CartItem from "@/components/cart/CartItem";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/format";
import { useEffect, useState } from "react";

export default function CartPage() {
	const [mounted, setMounted] = useState(false);

	const {
		cart,
		totalItems,
		totalPrice,
		incrementQuantity,
		decrementQuantity,
		removeItem,
		clearCart,
	} = useCart();

	
	useEffect(() => {
  	setMounted(true);
	}, []);
	
	if (!mounted) {
  	return null;
	}

	return (
		<section className="pt-28 pb-10 px-4 bg-gray-50 min-h-screen">
			<div className="max-w-5xl mx-auto">
				<div className="mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Carrito</h1>
						<p className="text-sm text-gray-600 mt-1">
							{totalItems} {totalItems === 1 ? "producto" : "productos"} en tu carrito
						</p>
					</div>

					{cart.length > 0 && (
						<button
							onClick={clearCart}
							className="text-sm text-red-600 hover:text-red-700 font-medium"
						>
							Vaciar carrito
						</button>
					)}
				</div>

				{cart.length === 0 ? (
					<div className="rounded-2xl bg-white border border-gray-200 p-8 sm:p-12 text-center">
						<h2 className="text-xl font-medium text-gray-900">Tu carrito esta vacio</h2>
						<p className="text-gray-600 mt-2">Agrega perfumes para verlos aqui.</p>
						<Link
							href="/"
							className="inline-block mt-6 px-6 py-3 rounded-lg bg-black text-white text-sm font-medium hover:opacity-90 transition"
						>
							Seguir comprando
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 lg:gap-6">
						<div className="space-y-3 sm:space-y-4">
							{cart.map((item) => (
								<CartItem
									key={item.variant_id}
									item={item}
									onIncrease={incrementQuantity}
									onDecrease={decrementQuantity}
									onDelete={removeItem}
								/>
							))}
						</div>

						<aside className="rounded-2xl border border-gray-200 bg-white p-5 h-fit lg:sticky lg:top-28">
							<h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
							<div className="mt-4 space-y-3 text-sm">
								<div className="flex items-center justify-between text-gray-600">
									<span>Productos</span>
									<span>{totalItems}</span>
								</div>
								<div className="flex items-center justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
									<span>Total</span>
									<span>{formatPrice(totalPrice)}</span>
								</div>
							</div>

							<button className="mt-5 w-full rounded-lg bg-black text-white py-3 text-sm font-medium hover:opacity-90 transition">
								Finalizar compra
							</button>
						</aside>
					</div>
				)}
			</div>
		</section>
	);
}
