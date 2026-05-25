import React from 'react';

const testimonials = [
	{ id: 1, name: 'María G.', quote: 'Me encantaron las fragancias y el servicio. Entrega rápida y empaquetado impecable.' },
	{ id: 2, name: 'Carlos R.', quote: 'Productos originales y atención amable. Volveré a comprar sin duda.' },
	{ id: 3, name: 'Lucía P.', quote: 'Gran variedad y facilidad para encontrar lo que buscaba.' },
];

export default function AboutPage() {
	return (
		<main style={styles.container}>
			<h1 style={styles.heading}>Sobre Nosotros</h1>
			<p style={styles.lead}>Apasionados por la perfumería: calidad, originalidad y atención al cliente.</p>

			<section aria-labelledby="experiencia-title" style={styles.section}>
				<h2 id="experiencia-title" style={styles.sectionTitle}>Experiencia en el mercado</h2>
				<p style={styles.paragraph}>Llevamos años en el sector seleccionando fragancias que destacan por su calidad y longevidad. Nuestro equipo trabaja directamente con proveedores verificados para garantizar autenticidad y buen servicio.</p>
			</section>

			<section aria-labelledby="perfumeria-title" style={styles.section}>
				<h2 id="perfumeria-title" style={styles.sectionTitle}>Perfumería Original</h2>
				<p style={styles.paragraph}>Nos especializamos en perfumería original: cada producto se revisa antes del envío y se almacena adecuadamente para conservar sus notas olfativas.</p>
				<ul style={styles.benefits}>
					<li>Proveedores confiables</li>
					<li>Control de calidad en cada lote</li>
					<li>Envíos seguros y seguimiento</li>
				</ul>
			</section>

			<section aria-labelledby="opiniones-title" style={styles.section}>
				<h2 id="opiniones-title" style={styles.sectionTitle}>Opiniones</h2>
				<ul style={styles.testimonials}>
					{testimonials.map((t) => (
						<li key={t.id} style={styles.testimonialItem}>
							<div style={styles.avatar} aria-hidden>
								<span style={styles.avatarLetter}>{t.name.charAt(0)}</span>
							</div>
							<div style={styles.testimonialContent}>
								<p style={styles.testimonialText}>&ldquo;{t.quote}&rdquo;</p>
								<p style={styles.testimonialName}>— {t.name}</p>
							</div>
						</li>
					))}
				</ul>
			</section>
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
		fontSize: 32,
		margin: '0 0 8px',
	},
	lead: {
		margin: '0 0 24px',
		color: '#444',
	},
	section: {
		marginBottom: 24,
		padding: 16,
		borderRadius: 8,
		border: '1px solid #eee',
		background: '#fff',
	},
	sectionTitle: {
		fontSize: 20,
		margin: '0 0 8px',
	},
	paragraph: {
		margin: 0,
		color: '#555',
		fontSize: 15,
		lineHeight: 1.5,
	},
	benefits: {
		marginTop: 12,
		paddingLeft: 20,
	},
	testimonials: {
		listStyle: 'none',
		padding: 0,
		margin: '12px 0 0',
		display: 'grid',
		gap: 12,
	},
	testimonialItem: {
		display: 'flex',
		gap: 12,
		alignItems: 'flex-start',
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 9999,
		background: '#f3f3f3',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 700,
		color: '#333',
		flex: '0 0 56px',
	},
	avatarLetter: {
		fontSize: 18,
	},
	testimonialContent: {
		flex: 1,
	},
	testimonialText: {
		margin: 0,
		color: '#333',
		fontSize: 14,
	},
	testimonialName: {
		margin: '6px 0 0',
		color: '#666',
		fontSize: 13,
	},
};

