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
		<main style={styles.container}>
			<h1 style={styles.heading}>Cómo comprar</h1>
			<p style={styles.lead}>Sigue estos pasos sencillos para completar tu compra.</p>

			<div style={styles.grid}>
				{steps.map((s) => (
					<article key={s.id} style={styles.card} aria-labelledby={`step-${s.id}-title`}>
						<div style={styles.placeholder} role="img" aria-label={`Imagen: ${s.title}`}>
							<div style={styles.number}>{s.id}</div>
							<div style={styles.placeholderText}>Imagen</div>
						</div>
						<div style={styles.cardContent}>
							<h2 id={`step-${s.id}-title`} style={styles.title}>{s.title}</h2>
							<p style={styles.description}>{s.description}</p>
						</div>
					</article>
				))}
			</div>
		</main>
	);
}

const styles: { [k: string]: React.CSSProperties } = {
	container: {
		maxWidth: 1100,
		margin: '40px auto',
		padding: '0 16px',
	},
	heading: {
		fontSize: 28,
		margin: '0 0 8px',
	},
	lead: {
		margin: '0 0 24px',
		color: '#444',
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
		gap: 20,
	},
	card: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
		padding: 16,
		borderRadius: 8,
		border: '1px solid #e6e6e6',
		background: '#fff',
	},
	placeholder: {
		height: 160,
		borderRadius: 8,
		background: '#f5f5f5',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
		overflow: 'hidden',
	},
	number: {
		position: 'absolute',
		top: 8,
		left: 8,
		background: '#111',
		color: '#fff',
		width: 28,
		height: 28,
		borderRadius: 20,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 700,
	},
	placeholderText: {
		color: '#888',
		fontSize: 14,
	},
	cardContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: 8,
	},
	title: {
		margin: 0,
		fontSize: 18,
	},
	description: {
		margin: 0,
		color: '#555',
		fontSize: 14,
	},
};

