import Image from "next/image";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

const collage = [
  { src: "/about/comunidad-1.jpg", alt: "Cliente abriendo su pedido envuelto en empaque dorado", span: "md:col-span-2 md:row-span-2" },
  { src: "/about/comunidad-2.jpg", alt: "Detalle de decants premium con etiquetas personalizadas", span: "" },
  { src: "/about/comunidad-3.jpg", alt: "Botella nicho sobre superficie de mármol oscuro", span: "" },
  { src: "/about/comunidad-4.jpg", alt: "Packaging premium con sello dorado de Aroma Perfumería", span: "" },
  { src: "/about/comunidad-5.jpg", alt: "Cliente sosteniendo un perfume recién recibido", span: "" },
  { src: "/about/comunidad-6.jpg", alt: "Detalle de atomizador junto a tarjeta de presentación", span: "md:col-span-2" },
];

const compromiso = [
  "Conservación óptima de cada fragancia en condiciones controladas",
  "Presentaciones cuidadas, dignas de un obsequio de lujo",
  "Envío protegido contra impactos y cambios de temperatura",
  "Control de calidad antes de cada despacho",
  "Postventa atenta: te acompañamos después de la compra",
];

export default function Comunidad() {
  return (
    <section
      aria-labelledby="comunidad-title"
      className="bg-[#080808] py-24 md:py-32 px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p
            className="text-[#c9a96e] tracking-[0.4em] text-xs mb-6 uppercase"
            style={{ fontFamily: serif }}
          >
            Comunidad
          </p>
          <h2
            id="comunidad-title"
            className="text-3xl md:text-5xl text-white leading-tight"
            style={{ fontFamily: serif }}
          >
            Una comunidad apasionada por los{" "}
            <span className="italic text-[#c9a96e]">perfumes</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[180px] md:auto-rows-[220px] mb-24">
          {collage.map((img) => (
            <div
              key={img.src}
              className={`relative overflow-hidden group ${img.span}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(min-width: 768px) 25vw, 50vw"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-[#c9a96e]/15" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p
              className="text-[#c9a96e] tracking-[0.4em] text-xs mb-6 uppercase"
              style={{ fontFamily: serif }}
            >
              Compromiso con la calidad
            </p>
            <h3
              className="text-3xl md:text-4xl text-white leading-tight mb-8"
              style={{ fontFamily: serif }}
            >
              Cada detalle, <span className="italic text-[#c9a96e]">cuidado</span>
            </h3>
            <ul className="space-y-4">
              {compromiso.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-4 text-white/80 text-base md:text-lg leading-relaxed"
                  style={{ fontFamily: serif }}
                >
                  <span
                    className="text-[#c9a96e] mt-2 flex-shrink-0"
                    aria-hidden="true"
                  >
                    —
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <blockquote className="border-l-2 border-[#c9a96e] pl-8 md:pl-12">
            <p
              className="text-white text-2xl md:text-4xl italic leading-snug"
              style={{ fontFamily: serif }}
            >
              &ldquo;El lujo no se trata únicamente de lo que llevas, sino de
              cómo te hace sentir.&rdquo;
            </p>
            <footer
              className="text-[#c9a96e] tracking-[0.3em] text-xs mt-6 uppercase"
              style={{ fontFamily: serif }}
            >
              — Aroma Perfumería
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
