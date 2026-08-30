import Image from "next/image";
import Link from "next/link";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

export default function CTAFinal() {
  return (
    <section
      aria-labelledby="cta-final-title"
      className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden"
    >
      <div className="relative z-10 text-center max-w-3xl px-6">
        <p
          className="text-krov-rose tracking-[0.4em] text-xs mb-8 uppercase"
        >
          Tu próxima firma
        </p>
        <h2
          id="cta-final-title"
          className="text-3xl md:text-5xl lg:text-6xl text-white leading-tight mb-8"
          style={{ fontFamily: serif }}
        >
          ¿Listo para encontrar tu próxima
          <br />
          <span className="italic text-krov-rose">firma olfativa</span>?
        </h2>
        <p
          className="text-white/80 text-base md:text-lg leading-relaxed mb-12 max-w-2xl mx-auto"
          style={{ fontFamily: serif }}
        >
          Explora nuestra colección y descubre la fragancia que se
          convertirá en tu sello personal. En KROV Perfumería te acompañamos
          en cada paso de ese descubrimiento.
        </p>
        <Link
          href="/products"
          aria-label="Explorar colección completa de perfumes"
          className="inline-block bg-krov-blood text-black px-12 py-4 tracking-[0.25em] text-sm uppercase border border-krov-blood hover:bg-transparent hover:text-krov-rose transition-all duration-500"
        >
          Explorar colección
        </Link>
      </div>
    </section>
  );
}
