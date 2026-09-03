const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

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
          "radial-gradient(ellipse at top, #1d1020 0%, #08060a 60%), repeating-linear-gradient(45deg, transparent 0 40px, rgba(255,11,85,0.03) 40px 41px)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-krov-rose tracking-[0.4em] text-xs mb-6 uppercase"
          >
            Identidad
          </p>
          <h2
            id="identidad-title"
            className="text-3xl md:text-5xl text-white leading-tight"
            style={{ fontFamily: serif }}
          >
            Quiénes <span className="italic text-krov-rose">somos</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
          <article className="border border-krov-smoke p-10 bg-black/40 backdrop-blur-sm">
            <h3
              className="text-krov-rose tracking-[0.3em] text-xs mb-5 uppercase"
            >
              Misión
            </h3>
            <p
              className="text-white text-xl md:text-2xl leading-relaxed italic"
              style={{ fontFamily: serif }}
            >
              Democratizar la perfumería en Costa Rica, acercando las
              creaciones olfativas más relevantes del mundo a cada amante del
              perfume mediante una experiencia de calidad.
            </p>
          </article>

          <article className="border border-krov-smoke p-10 bg-black/40 backdrop-blur-sm">
            <h3
              className="text-krov-rose tracking-[0.3em] text-xs mb-5 uppercase"
            >
              Visión
            </h3>
            <p
              className="text-white text-xl md:text-2xl leading-relaxed italic"
              style={{ fontFamily: serif }}
            >
              Convertirnos en la perfumería de referencia en Centroamérica,
              reconocidos por la autenticidad, excelencia, y originalidad en
              cada experiencia.
            </p>
          </article>
        </div>

        <div className="mb-20">
          <h3
            className="text-center text-2xl md:text-3xl text-white mb-12"
            style={{ fontFamily: serif }}
          >
            Nuestros <span className="italic text-krov-rose">valores</span>
          </h3>
          <ul className="grid grid-cols-2 md:grid-cols-5 gap-px bg-krov-blood/15">
            {valores.map((v) => (
              <li
                key={v.title}
                className="bg-krov-void p-8 text-center hover:bg-krov-ink transition-colors duration-500"
              >
                <div
                  className="w-10 h-10 mx-auto mb-5 border border-krov-blood/50 rotate-45 flex items-center justify-center"
                  aria-hidden="true"
                >
                  <div className="w-2 h-2 bg-krov-blood" />
                </div>
                <h4
                  className="text-krov-rose text-lg mb-3"
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

        <div className="max-w-3xl mx-auto border border-krov-blood/30 p-10 bg-black/40 backdrop-blur-sm">
          <h3
            className="text-krov-rose tracking-[0.3em] text-xs mb-8 uppercase text-center"
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
                  className="text-krov-rose flex-shrink-0 mt-1"
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
