import Image from "next/image";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

export default function Historia() {
  return (
    <section
      aria-labelledby="historia-title"
      className="bg-[#0a0a0a] py-24 md:py-32 px-6"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
        <div>
          <p
            className="text-[#c9a96e] tracking-[0.4em] text-xs mb-6 uppercase"
            style={{ fontFamily: serif }}
          >
            Nuestra historia
          </p>
          <h2
            id="historia-title"
            className="text-3xl md:text-5xl text-white leading-tight mb-8"
            style={{ fontFamily: serif }}
          >
            Una pasión convertida en
            <span className="italic text-[#c9a96e]"> experiencia</span>
          </h2>
          <div
            className="space-y-5 text-white/75 text-base md:text-lg leading-relaxed"
            style={{ fontFamily: serif }}
          >
            <p>
              Aroma Perfumería nació de una necesidad y de un sueño: dar acceso
              en Costa Rica a las fragancias más codiciadas del mundo. Lo que
              comenzó como una búsqueda personal por casas perfumistas
              exclusivas se transformó en una curaduría dedicada a quienes
              entienden el perfume como un arte.
            </p>
            <p>
              Cada botella que ofrecemos ha sido seleccionada por su carácter,
              su historia y la firma de su perfumista. No vendemos productos,
              acompañamos descubrimientos olfativos.
            </p>
          </div>

          <div className="mt-12 pl-6 border-l border-[#c9a96e]/40">
            <p
              className="text-[#c9a96e] tracking-[0.3em] text-xs mb-3 uppercase"
              style={{ fontFamily: serif }}
            >
              Nuestra filosofía
            </p>
            <p
              className="text-white text-xl md:text-2xl italic"
              style={{ fontFamily: serif }}
            >
              La excelencia está en los detalles.
            </p>
          </div>
        </div>

        <div className="relative aspect-4/5 w-full overflow-hidden">
          <Image
            src="/images/about/SecondAbout.jpg"
            alt="Mesa con perfumes nicho dispuestos con iluminación cálida y editorial"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute inset-0 ring-1 ring-inset ring-[#c9a96e]/20" />
        </div>
      </div>
    </section>
  );
}
