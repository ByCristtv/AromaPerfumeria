"use client";

import { useEffect, useRef, useState } from "react";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const pasos = [
  {
    n: "01",
    title: "Descubre",
    desc: "Explora nuestro catálogo curado de casas nicho y diseñadores de lujo.",
  },
  {
    n: "02",
    title: "Encuentra tu firma",
    desc: "Prueba con decants premium hasta identificar la fragancia que te define.",
  },
  {
    n: "03",
    title: "Vive la experiencia",
    desc: "Recibe tu perfume en empaque cuidado y conviértelo en tu sello personal.",
  },
];

const stats = [
  { value: 2500, prefix: "+", suffix: "", label: "Clientes satisfechos" },
  { value: 8000, prefix: "+", suffix: "", label: "Pedidos entregados" },
  { value: 300, prefix: "+", suffix: "", label: "Fragancias" },
  { value: 50, prefix: "+", suffix: "", label: "Casas perfumistas" },
];

function CountUp({
  to,
  duration = 1500,
  active,
}: {
  to: number;
  duration?: number;
  active: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, active]);

  return <>{value.toLocaleString("es-CR")}</>;
}

export default function ExperienciaStats() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="experiencia-title"
      className="bg-[#0a0a0a] py-24 md:py-32 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p
            className="text-[#c9a96e] tracking-[0.4em] text-xs mb-6 uppercase"
            style={{ fontFamily: serif }}
          >
            La experiencia
          </p>
          <h2
            id="experiencia-title"
            className="text-3xl md:text-5xl text-white leading-tight"
            style={{ fontFamily: serif }}
          >
            Experiencia <span className="italic text-[#c9a96e]">Aroma Perfumeria</span>
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-28">
          {pasos.map((p) => (
            <li key={p.n} className="relative pl-16">
              <span
                className="absolute left-0 top-0 text-5xl md:text-6xl text-[#c9a96e]/30"
                style={{ fontFamily: serif }}
                aria-hidden="true"
              >
                {p.n}
              </span>
              <h3
                className="text-white text-2xl mb-4"
                style={{ fontFamily: serif }}
              >
                {p.title}
              </h3>
              <p
                className="text-white/65 leading-relaxed"
                style={{ fontFamily: serif }}
              >
                {p.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="text-center mb-14">
          <p
            className="text-[#c9a96e] tracking-[0.4em] text-xs mb-4 uppercase"
            style={{ fontFamily: serif }}
          >
            Estadísticas
          </p>
          <h3
            className="text-2xl md:text-4xl text-white"
            style={{ fontFamily: serif }}
          >
            Números que <span className="italic text-[#c9a96e]">hablan por nosotros</span>
          </h3>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#c9a96e]/15"
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#0a0a0a] p-8 md:p-10 text-center"
            >
              <div
                className="text-[#c9a96e] text-4xl md:text-5xl mb-3"
                style={{ fontFamily: serif }}
                aria-label={`${s.prefix}${s.value}${s.suffix} ${s.label}`}
              >
                {s.prefix}
                <CountUp to={s.value} active={visible} />
                {s.suffix}
              </div>
              <div
                className="text-white/65 text-xs md:text-sm tracking-[0.2em] uppercase"
                style={{ fontFamily: serif }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
