const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const valores = [
  { title: "Autenticidad", desc: "Cada fragancia, garantizada como original." },
  { title: "Excelencia", desc: "Estándares premium en cada interacción." },
  { title: "Confianza", desc: "Transparencia total con nuestra comunidad." },
  { title: "Pasión", desc: "Vivimos y respiramos perfumería de alto nivel." },
  { title: "Innovación", desc: "Pioneros del decant premium en Costa Rica." },
];

const promesas = [
  "Productos 100% originales y certificados",
  "Decants envasados con jeringas de precisión",
  "Empaque protector de presentación premium",
  "Atención personalizada antes y después de la compra",
  "Envíos seguros con seguimiento a todo el país",
];

export default function Identidad() {
  return (
    <section
      aria-labelledby="identidad-title"
      className="relative py-24 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, #1a1410 0%, #0a0a0a 60%), repeating-linear-gradient(45deg, transparent 0 40px, rgba(201,169,110,0.03) 40px 41px)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-[#c9a96e] tracking-[0.4em] text-xs mb-6 uppercase"
            style={{ fontFamily: serif }}
          >
            Identidad
          </p>
          <h2
            id="identidad-title"
            className="text-3xl md:text-5xl text-white leading-tight"
            style={{ fontFamily: serif }}
          >
            Quiénes <span className="italic text-[#c9a96e]">somos</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
          <article className="border border-[#c9a96e]/25 p-10 bg-black/40 backdrop-blur-sm">
            <h3
              className="text-[#c9a96e] tracking-[0.3em] text-xs mb-5 uppercase"
              style={{ fontFamily: serif }}
            >
              Misión
            </h3>
            <p
              className="text-white text-xl md:text-2xl leading-relaxed italic"
              style={{ fontFamily: serif }}
            >
              Democratizar la perfumería de lujo en Costa Rica, acercando las
              creaciones olfativas más exclusivas del mundo a cada amante del
              perfume.
            </p>
          </article>

          <article className="border border-[#c9a96e]/25 p-10 bg-black/40 backdrop-blur-sm">
            <h3
              className="text-[#c9a96e] tracking-[0.3em] text-xs mb-5 uppercase"
              style={{ fontFamily: serif }}
            >
              Visión
            </h3>
            <p
              className="text-white text-xl md:text-2xl leading-relaxed italic"
              style={{ fontFamily: serif }}
            >
              Convertirnos en la perfumería de referencia en Centroamérica,
              reconocidos por la curaduría, la autenticidad y la excelencia en
              cada experiencia.
            </p>
          </article>
        </div>

        <div className="mb-20">
          <h3
            className="text-center text-2xl md:text-3xl text-white mb-12"
            style={{ fontFamily: serif }}
          >
            Nuestros <span className="italic text-[#c9a96e]">valores</span>
          </h3>
          <ul className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#c9a96e]/15">
            {valores.map((v) => (
              <li
                key={v.title}
                className="bg-[#0a0a0a] p-8 text-center hover:bg-[#111] transition-colors duration-500"
              >
                <div
                  className="w-10 h-10 mx-auto mb-5 border border-[#c9a96e]/50 rotate-45 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <div className="w-2 h-2 bg-[#c9a96e]" />
                </div>
                <h4
                  className="text-[#c9a96e] text-lg mb-3"
                  style={{ fontFamily: serif }}
                >
                  {v.title}
                </h4>
                <p
                  className="text-white/60 text-sm leading-relaxed"
                  style={{ fontFamily: serif }}
                >
                  {v.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-3xl mx-auto border border-[#c9a96e]/30 p-10 bg-black/40 backdrop-blur-sm">
          <h3
            className="text-[#c9a96e] tracking-[0.3em] text-xs mb-8 uppercase text-center"
            style={{ fontFamily: serif }}
          >
            Nuestra promesa
          </h3>
          <ul className="space-y-4">
            {promesas.map((p) => (
              <li
                key={p}
                className="flex items-start gap-4 text-white/85 text-base md:text-lg"
                style={{ fontFamily: serif }}
              >
                <span
                  className="text-[#c9a96e] flex-shrink-0 mt-1"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
