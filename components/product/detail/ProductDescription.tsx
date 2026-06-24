interface ProductDescriptionProps {
  description: string;
}

export default function ProductDescription({
  description,
}: ProductDescriptionProps) {
  return (
    <section className="relative max-w-3xl mx-auto text-center">
      <p
        className="text-[11px] tracking-[0.32em] uppercase"
        style={{ color: "#c9a96e" }}
      >
        Descripción
      </p>
      <div className="mt-4 flex justify-center">
        <span
          className="h-px w-12"
          style={{
            background:
              "linear-gradient(90deg, transparent, #c9a96e, transparent)",
          }}
        />
      </div>
      <p
        className="mt-6 text-lg sm:text-xl leading-relaxed text-black/70 whitespace-pre-line"
        style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
      >
        {description}
      </p>
    </section>
  );
}
