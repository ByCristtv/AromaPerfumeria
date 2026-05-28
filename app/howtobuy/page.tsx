import React from 'react';

const steps = [
	{ id: 1, title: 'Registrarse', description: 'Crea una cuenta con tu correo electrónico para acceder al carrito y ordenar fácilmente.' },
	{ id: 2, title: 'Ver Catálogo', description: 'Explora nuestro catálogo para encontrar productos por categoría y marca.' },
	{ id: 3, title: 'Agregar productos', description: 'Añade los productos que desees al carrito desde la tarjeta o la página del producto.' },
	{ id: 4, title: 'Revisar el carrito', description: 'Revisa cantidades, elimina o actualiza ítems antes de proceder al pago.' },
	{ id: 5, title: 'Formulario de compra', description: 'Completa tus datos de envío y facturación en el formulario de compra.' },
	{ id: 6, title: 'Pasarela de pago', description: 'Selecciona el método de pago y confirma la compra de forma segura.' },
];

export default function HowToBuyPage() {
	return (
		<main className="max-w-[1100px] mx-auto my-10 px-4">
			<h1 className="text-2xl font-semibold mb-2">Cómo comprar</h1>
			<p className="mb-6 text-gray-600">Sigue estos pasos sencillos para completar tu compra.</p>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{steps.map((s, i) => (
					<article
						key={s.id}
						aria-labelledby={`step-${s.id}-title`}
						className="flex flex-col gap-3 p-4 rounded-lg border border-gray-200 bg-white opacity-0 animate-fadeUp"
						style={{ animationDelay: `${i * 80}ms` }}
					>
						<div className="h-40 rounded-lg bg-gray-100 flex items-center justify-center relative overflow-hidden" role="img" aria-label={`Imagen: ${s.title}`}>
							<div className="absolute top-2 left-2 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm">{s.id}</div>
							<div className="text-gray-500 text-sm">Imagen</div>
						</div>

						<div className="flex flex-col gap-2">
							<h2 id={`step-${s.id}-title`} className="m-0 text-base font-medium">{s.title}</h2>
							<p className="m-0 text-sm text-gray-600">{s.description}</p>
						</div>
					</article>
				))}
			</div>
		</main>
	);
}

