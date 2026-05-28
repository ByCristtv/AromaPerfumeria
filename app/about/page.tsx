import React from 'react';

const testimonials = [
	{ id: 1, name: 'María G.', quote: 'Me encantaron las fragancias y el servicio. Entrega rápida y empaquetado impecable.' },
	{ id: 2, name: 'Carlos R.', quote: 'Productos originales y atención amable. Volveré a comprar sin duda.' },
	{ id: 3, name: 'Lucía P.', quote: 'Gran variedad y facilidad para encontrar lo que buscaba.' },
];

export default function AboutPage() {
	return (
		<main className="max-w-[1100px] mx-auto my-10 px-4">
			<h1 className="text-[32px] font-semibold mb-2">Sobre Nosotros</h1>
			<p className="mb-6 text-gray-600">Apasionados por la perfumería: calidad, originalidad y atención al cliente.</p>

			<section
				aria-labelledby="experiencia-title"
				className="mb-6 p-4 rounded-lg border border-gray-200 bg-white opacity-0 animate-fadeUp"
				style={{ animationDelay: '0ms' }}
			>
				<h2 id="experiencia-title" className="text-lg font-medium mb-2">Experiencia en el mercado</h2>
				<p className="text-sm text-gray-600">Llevamos años en el sector seleccionando fragancias que destacan por su calidad y longevidad. Nuestro equipo trabaja directamente con proveedores verificados para garantizar autenticidad y buen servicio.</p>
			</section>

			<section
				aria-labelledby="perfumeria-title"
				className="mb-6 p-4 rounded-lg border border-gray-200 bg-white opacity-0 animate-fadeUp"
				style={{ animationDelay: '150ms' }}
			>
				<h2 id="perfumeria-title" className="text-lg font-medium mb-2">Perfumería Original</h2>
				<p className="text-sm text-gray-600">Nos especializamos en perfumería original: cada producto se revisa antes del envío y se almacena adecuadamente para conservar sus notas olfativas.</p>
				<ul className="mt-3 pl-5 list-disc">
					<li className="text-sm text-gray-700">Proveedores confiables</li>
					<li className="text-sm text-gray-700">Control de calidad en cada lote</li>
					<li className="text-sm text-gray-700">Envíos seguros y seguimiento</li>
				</ul>
			</section>

			<section
				aria-labelledby="opiniones-title"
				className="mb-6 p-4 rounded-lg border border-gray-200 bg-white opacity-0 animate-fadeUp"
				style={{ animationDelay: '300ms' }}
			>
				<h2 id="opiniones-title" className="text-lg font-medium mb-2">Opiniones</h2>
				<ul className="mt-3 grid gap-3 list-none p-0 m-0">
					{testimonials.map((t) => (
						<li key={t.id} className="flex gap-3 items-start">
							<div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-700 flex-none" aria-hidden="true">
								<span className="text-lg">{t.name.charAt(0)}</span>
							</div>
							<div className="flex-1">
								<p className="text-sm text-gray-800">&ldquo;{t.quote}&rdquo;</p>
								<p className="mt-1 text-xs text-gray-500">— {t.name}</p>
							</div>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}

