const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const items = [
  {
    icon: (
      <path d="M12 2l2.39 4.84L20 7.62l-4 3.9.94 5.48L12 14.77 7.06 17l.94-5.48-4-3.9 5.61-.78L12 2z" />
    ),
    title: "100% Originales",
    desc: "Garantizamos perfumes auténticos importados directamente de casas oficiales y distribuidores certificados.",
  },
  {
    icon: (
      <>
        <path d="M9 2h6v4H9z" />
        <path d="M8 6h8l-1 16H9L8 6z" />
      </>
    ),
    title: "Decants Premium",
    desc: "Atomizadores de 2ml, 5ml y 10ml decantados con jeringas de precisión: prueba antes de invertir en el frasco completo.",
  },
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    title: "Experiencia de Lujo",
    desc: "Cada interacción —empaque, envío y atención— refleja el cuidado que merece una fragancia de alta gama.",
  },
  {
    icon: (
      <>
        <path d="M4 4h16v4H4z" />
        <path d="M4 10h16v4H4z" />
        <path d="M4 16h16v4H4z" />
      </>
    ),
    title: "Catálogo Curado",
    desc: "Selección rigurosa de casas nicho y diseñadores de lujo. Calidad sobre cantidad, siempre.",
  },
  {
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </>
    ),
    title: "Atención Personalizada",
    desc: "Te asesoramos para encontrar tu firma olfativa según tu personalidad, ocasión y estación.",
  },
  {
    icon: (
      <>
        <path d="M3 7h13l3 4h2v6h-2a2 2 0 1 1-4 0H10a2 2 0 1 1-4 0H3V7z" />
      </>
    ),
    title: "Envíos a Todo Costa Rica",
    desc: "Entregas seguras a cualquier zona del país con empaque protector y seguimiento en tiempo real.",
  },
];

export default function Diferenciadores() {
  return (
    <section
      aria-labelledby="diferenciadores-title"
      className="bg-[#080808] py-24 md:py-32 px-6 relative"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-[#c9a96e] tracking-[0.4em] text-xs mb-6 uppercase"
            style={{ fontFamily: serif }}
          >
            Aroma Perfumeria
          </p>
          <h2
            id="diferenciadores-title"
            className="text-3xl md:text-5xl text-white leading-tight"
            style={{ fontFamily: serif }}
          >
            Lo que nos <span className="italic text-[#c9a96e]">diferencia</span>
          </h2>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#c9a96e]/15">
          {items.map((it) => (
            <li
              key={it.title}
              className="bg-[#0a0a0a] p-10 group hover:bg-[#111] transition-colors duration-500"
            >
              <div
                className="w-14 h-14 mb-8 flex items-center justify-center border border-[#c9a96e]/40 text-[#c9a96e] group-hover:bg-[#c9a96e] group-hover:text-black transition-all duration-500"
                aria-hidden="true"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {it.icon}
                </svg>
              </div>
              <h3
                className="text-white text-2xl mb-4"
                style={{ fontFamily: serif }}
              >
                {it.title}
              </h3>
              <p
                className="text-white/65 leading-relaxed"
                style={{ fontFamily: serif }}
              >
                {it.desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
