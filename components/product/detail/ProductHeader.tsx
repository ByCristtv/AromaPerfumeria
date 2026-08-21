"use client";

interface ProductHeaderProps {
  brand: string;
  name: string;
  gender: "masculine" | "feminine" | "unisex";
  concentration: string;
}

const GENDER_LABEL: Record<ProductHeaderProps["gender"], string> = {
  masculine: "Masculino",
  feminine: "Femenino",
  unisex: "Unisex",
};

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * Brand line, name, and the two facts that classify a fragrance.
 *
 * The per-element entrance animations are gone. Three staggered Framer nodes
 * meant the product's own name faded in after the page had already painted —
 * on a slow connection the most important text on the screen was the last thing
 * to arrive. It renders immediately now; the page's motion budget is spent on
 * scroll reveals further down, where nothing is waiting on it.
 */
export default function ProductHeader({
  brand,
  name,
  gender,
  concentration,
}: ProductHeaderProps) {
  return (
    <div>
      {brand && (
        <p className="text-[10px] uppercase tracking-[0.34em] text-krov-rose">
          {brand}
        </p>
      )}

      <h1
        className="mt-4 text-4xl leading-[1.02] text-krov-bone sm:text-5xl"
        style={{ fontFamily: serif }}
      >
        {name}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Chip>{concentration}</Chip>
        <Chip>{GENDER_LABEL[gender]}</Chip>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center border border-krov-smoke px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-krov-ash">
      {children}
    </span>
  );
}
