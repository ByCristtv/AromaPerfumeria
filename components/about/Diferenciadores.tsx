const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

const items = [
  {
    icon: (
      <path d="M12 2l2.39 4.84L20 7.62l-4 3.9.94 5.48L12 14.77 7.06 17l.94-5.48-4-3.9 5.61-.78L12 2z" />
    ),
    title: "100% Originales",
    desc: "Garantizamos fragancias auténticas importadas directamente de casas oficiales y distribuidores certificados.",
  },
  {
    icon: (
      <>
        <path d="M9 2h6v4H9z" />
        <path d="M8 6h8l-1 16H9L8 6z" />
      </>
    ),
    title: "Decants de Precisión",
    desc: "Formatos de 2ml, 5ml y 10ml fraccionados con jeringas de precisión.",
  },
  {
    icon: (
      <>
        <path d="M6 9l6 7 6-7" />
        <path d="M12 3v13" />
        <path d="M5 21h14" />
      </>
    ),
    title: "Sistema de Rangos & XP",
    desc: "Suma experiencia con cada compra, escala niveles en tu perfil y desbloquea el estatus que tu colección merece.",
  },
  {
    icon: (
      <>
        <path d="M12 15l-2 5l9-11h-7l2-5l-9 11h7z" />
      </>
    ),
    title: "Recompensas por Nivel",
    desc: "Entre más alto tu rango, mejores tus privilegios por fidelidad.",
  },
  {
    icon: (
      <>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 1 1 0-4" />
        <path d="M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
        <path d="M12 11l2 2l4 -4" />
      </>
    ),
    title: "Ranking Nacional Olfativo",
    desc: "Compite con los mayores coleccionistas del país. Muestra tu estatus, domina el leaderboard y demuestra de qué está hecha tu repisa.",
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
    desc: "Calidad sobre cantidad, siempre.",
  },
];

export default function Diferenciadores() {
  return (
    <section
      aria-labelledby="diferenciadores-title"
      className="bg-krov-void py-24 md:py-32 px-6 relative"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-krov-rose tracking-[0.4em] text-xs mb-6 uppercase"
          >
            KROV Perfumería
          </p>
          <h2
            id="diferenciadores-title"
            className="text-3xl md:text-5xl text-white leading-tight"
            style={{ fontFamily: serif }}
          >
            Lo que nos <span className="italic text-krov-rose">diferencia</span>
          </h2>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-krov-blood/15">
          {items.map((it) => (
            <li
              key={it.title}
              className="bg-krov-void p-10 group hover:bg-krov-ink transition-colors duration-500"
            >
              <div
                className="w-14 h-14 mb-8 flex items-center justify-center border border-krov-blood/40 text-krov-rose group-hover:bg-krov-blood group-hover:text-black transition-all duration-500"
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
