import Image from "next/image";
import Link from "next/link";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

export default function AboutHero() {
  return (
    <section
      aria-label="Bienvenida a KROV Perfumería"
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
          className="text-krov-rose tracking-[0.4em] text-xs md:text-sm mb-6 uppercase"
        >
          кровь · Costa Rica
        </p>
        <h1
          className="text-4xl md:text-6xl lg:text-7xl text-white leading-tight mb-8"
          style={{ fontFamily: serif }}
        >
          Tu fragancia
          <br />
          <span className="italic text-krov-blush">no es mas que un accesorio</span>
        </h1>
        <p
          className="text-white/80 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10"
          style={{ fontFamily: serif }}
        >
          KROV - del ruso кровь: sangre. Encuentra la fragancia perfecta para formar tu identidad y tu ADN olfativo. Traemos perfumeria original en decants, botellas y sets pensados para cada ocasión.
        </p>
        <Link
          href="/products"
          aria-label="Explorar colección de perfumes"
          className="krov-btn-primary"
        >
          Explorar colección
        </Link>
      </div>

      <div
        aria-hidden
        className="krov-rule absolute inset-x-0 bottom-0 z-10 h-px"
      />
    </section>
  );
}
