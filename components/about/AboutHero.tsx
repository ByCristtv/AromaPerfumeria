import Image from "next/image";
import Link from "next/link";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

export default function AboutHero() {
  return (
    <section
      aria-label="Bienvenida a Aroma Perfumería"
      className="relative h-[92vh] w-full flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/about/HeroAbout.jpg"
          alt="Botellas de perfume exclusivas sobre mármol negro con iluminación cálida"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/50 to-black/80" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <p
          className="text-[#c9a96e] tracking-[0.4em] text-xs md:text-sm mb-6 uppercase"
          style={{ fontFamily: serif }}
        >
          Aroma Perfumería · Costa Rica
        </p>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-8"
          style={{ fontFamily: serif }}
        >
          Más que perfumes,
          <br />
          <span className="italic text-[#c9a96e]">una experiencia de lujo</span>
        </h1>
        <p
          className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ fontFamily: serif }}
        >
          En Aroma Perfumería, creemos que una fragancia es una extensión de la
          personalidad y una forma de dejar una impresión inolvidable. Nos
          especializamos en ofrecer perfumes nicho, diseñadores de lujo y
          decants originales para acercar las mejores creaciones olfativas del
          mundo a los amantes de la perfumería en Costa Rica.
        </p>
        <Link
          href="/products"
          aria-label="Explorar colección de perfumes"
          className="inline-block bg-transparent text-[#c9a96e] border border-[#c9a96e] px-10 py-4 tracking-[0.25em] text-sm uppercase hover:bg-[#c9a96e] hover:text-black transition-all duration-500"
          style={{ fontFamily: serif }}
        >
          Explorar colección
        </Link>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-[#c9a96e]/60 text-xs tracking-[0.3em]">
        ↓ DESCUBRE
      </div>
    </section>
  );
}
