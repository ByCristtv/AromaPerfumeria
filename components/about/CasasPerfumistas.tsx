"use client";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

const houses = [
  "Parfums de Marly",
  "Creed",
  "Maison Francis Kurkdjian",
  "Xerjoff",
  "Initio Parfums Privés",
  "Amouage",
  "Tom Ford",
  "Dior Privée",
  "Louis Vuitton",
  "Jean Paul Gaultier",
  "Roja Parfums",
  "Mancera",
  "Nishane",
  "BDK Parfums",
];

export default function CasasPerfumistas() {
  const loop = [...houses, ...houses];

  return (
    <section
      aria-labelledby="casas-title"
      className="bg-krov-void py-24 md:py-32 border-y border-krov-smoke/85"
    >
      <div className="max-w-7xl mx-auto px-6 text-center mb-16">
        <p
          className="text-krov-rose tracking-[0.4em] text-xs mb-6 uppercase"
        >
          Casas perfumistas
        </p>
        <h2
          id="casas-title"
          className="text-3xl md:text-5xl text-white leading-tight mb-6"
          style={{ fontFamily: serif }}
        >
          Las firmas más <span className="italic text-krov-rose">codiciadas</span>
        </h2>
        <p
          className="text-white/65 max-w-2xl mx-auto text-base md:text-lg leading-relaxed"
          style={{ fontFamily: serif }}
        >
          Trabajamos con las maisons más distinguidas del mundo, desde casas
          nicho de culto hasta diseñadores legendarios. Cada nombre en nuestro
          catálogo representa un universo olfativo único.
        </p>
      </div>

      <div className="relative overflow-hidden" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-krov-void to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-krov-void to-transparent z-10" />

        <div
          className="flex gap-16 whitespace-nowrap animate-marquee"
          style={{ fontFamily: serif }}
        >
          {loop.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-white/40 grayscale text-2xl md:text-3xl tracking-wider hover:text-krov-rose transition-colors duration-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes about-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: about-marquee 50s linear infinite;
          width: max-content;
        }
      `}</style>
    </section>
  );
}
