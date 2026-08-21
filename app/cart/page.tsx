"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CartItem from "@/components/cart/CartItem";
import { useCart } from "@/hooks/useCart";
import { useCartPricing } from "@/hooks/useCartPricing";
import { useIsMounted } from "@/hooks/useIsMounted";
import { formatPrice } from "@/lib/format";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * The cart, rebuilt as a manifest.
 *
 * Previously this page (and the whole checkout funnel behind it) was a light
 * grey "SaaS" screen with white rounded cards — a different product from the
 * catalogue the customer had just been browsing, presented at the exact moment
 * they decide whether to pay. It now shares the storefront's ground, type and
 * red.
 *
 * Cart behaviour is untouched: the same `useCart` actions, the same
 * `useCartPricing` wholesale resolution, the same `/checkout` destination.
 */
export default function CartPage() {
	const mounted = useIsMounted();

	const {
		cart,
		totalItems,
		incrementQuantity,
		decrementQuantity,
		removeItem,
		clearCart,
	} = useCart();

	// Wholesale-aware pricing (retail for everyone else). Display only — the
	// server recomputes authoritatively at checkout.
	const { pricing } = useCartPricing(cart);

	if (!mounted) {
		return null;
	}

	return (
		<section className="min-h-screen bg-krov-void px-5 pb-24 pt-28 sm:px-8">
			<div className="mx-auto max-w-5xl">
				<header className="animate-fadeUp opacity-0" style={{ animationDelay: "0ms" }}>
					<p className="krov-eyebrow">Tu selección</p>
					<div className="mt-5 flex flex-wrap items-end justify-between gap-4">
						<h1
							className="text-4xl leading-none text-krov-bone sm:text-5xl"
							style={{ fontFamily: serif }}
						>
							Carrito
						</h1>

						{cart.length > 0 && (
							<button
								onClick={clearCart}
								className="krov-underline text-[10px] uppercase tracking-[0.22em] text-krov-dust transition-colors hover:text-krov-bone"
							>
								Vaciar carrito
							</button>
						)}
					</div>
					<p className="mt-3 text-sm text-krov-ash">
						{totalItems} {totalItems === 1 ? "fragancia" : "fragancias"} en camino a ser tuyas
					</p>
					<div className="krov-rule mt-7 h-px w-full" />
				</header>

				{cart.length === 0 ? (
					<div
						className="animate-fadeUp mt-16 border border-krov-smoke bg-krov-coal px-6 py-20 text-center opacity-0"
						style={{ animationDelay: "90ms" }}
					>
						<h2
							className="text-2xl text-krov-bone sm:text-3xl"
							style={{ fontFamily: serif }}
						>
							Todavía no elegiste nada
						</h2>
						<p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-krov-ash">
							Tu firma olfativa está en algún lugar de la colección. Nos falta
							encontrarla.
						</p>
						<Link href="/products" className="krov-btn-primary mt-9">
							Ver la colección
							<ArrowRight size={14} aria-hidden />
						</Link>
					</div>
				) : (
					<div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
						{/* ── Lines ─────────────────────────────────────────────── */}
						<div className="border-t border-krov-smoke">
							{cart.map((item, i) => (
								<div
									key={item.variant_id}
									className="animate-fadeUp opacity-0"
									style={{ animationDelay: `${i * 70}ms` }}
								>
									<CartItem
										item={item}
										line={pricing.lines[item.variant_id]}
										onIncrease={incrementQuantity}
										onDecrease={decrementQuantity}
										onDelete={removeItem}
									/>
								</div>
							))}
						</div>

						{/* ── Summary ───────────────────────────────────────────── */}
						<aside
							className="animate-fadeUp h-fit border border-krov-smoke bg-krov-coal p-6 opacity-0 lg:sticky lg:top-28"
							style={{
								animationDelay: `${Math.max(200, cart.length * 70)}ms`,
							}}
						>
							<h2 className="text-[10px] uppercase tracking-[0.3em] text-krov-rose">
								Resumen
							</h2>

							<dl className="mt-6 space-y-3.5 text-sm">
								<div className="flex items-center justify-between text-krov-ash">
									<dt>Productos</dt>
									<dd className="tabular-nums">{totalItems}</dd>
								</div>

								{pricing.hasWholesaleApplied && (
									<>
										<div className="flex items-center justify-between text-krov-dust">
											<dt>Precio regular</dt>
											<dd className="tabular-nums line-through">
												{formatPrice(pricing.retailSubtotal)}
											</dd>
										</div>
										<div className="flex items-center justify-between text-krov-rose">
											<dt>Ahorro mayorista</dt>
											<dd className="tabular-nums">
												−{formatPrice(pricing.wholesaleSavings)}
											</dd>
										</div>
									</>
								)}

								<div className="flex items-baseline justify-between border-t border-krov-smoke pt-4">
									<dt className="text-[10px] uppercase tracking-[0.24em] text-krov-ash">
										Total
									</dt>
									<dd
										className="text-2xl tabular-nums text-krov-bone"
										style={{ fontFamily: serif }}
									>
										{formatPrice(pricing.subtotal)}
									</dd>
								</div>
							</dl>

							<Link href="/checkout" className="krov-btn-primary mt-7 w-full">
								Finalizar compra
							</Link>

							<Link
								href="/products"
								className="mt-4 block text-center text-[10px] uppercase tracking-[0.22em] text-krov-dust transition-colors hover:text-krov-bone"
							>
								Seguir explorando
							</Link>
						</aside>
					</div>
				)}
			</div>
		</section>
	);
}
