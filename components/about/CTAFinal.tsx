import Image from "next/image";
import Link from "next/link";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

export default function CTAFinal() {
  return (
    <section
      aria-labelledby="cta-final-title"
      className="relative h-[85vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <Image
          src="/about/cta-final.jpg"
          alt="Perfume de lujo sobre mármol negro con luces doradas desenfocadas al fondo"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/50" />
      </div>

      <div className="relative z-10 text-center max-w-3xl px-6">
        <p
          className="text-[#c9a96e] tracking-[0.4em] text-xs mb-8 uppercase"
          style={{ fontFamily: serif }}
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
          <span className="italic text-[#c9a96e]">firma olfativa</span>?
        </h2>
        <p
          className="text-white/80 text-base md:text-lg leading-relaxed mb-12 max-w-2xl mx-auto"
          style={{ fontFamily: serif }}
        >
          Explora nuestra colección curada y descubre la fragancia que se
          convertirá en tu sello personal. En Aroma Perfumería te acompañamos
          en cada paso de ese descubrimiento.
        </p>
        <Link
          href="/products"
          aria-label="Explorar colección completa de perfumes"
          className="inline-block bg-[#c9a96e] text-black px-12 py-4 tracking-[0.25em] text-sm uppercase border border-[#c9a96e] hover:bg-transparent hover:text-[#c9a96e] transition-all duration-500"
          style={{ fontFamily: serif }}
        >
          Explorar colección
        </Link>
      </div>
    </section>
  );
}
