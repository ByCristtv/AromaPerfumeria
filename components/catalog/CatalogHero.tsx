const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * The masthead over the collection.
 *
 * This was previously a single pill badge floating in ~200px of empty space —
 * the catalogue opened on nothing. It now opens the way a magazine section
 * opens: a label, a statement, and a rule, with the grid starting immediately
 * beneath.
 *
 * Server component. It was a client component only to run a Framer stagger on
 * two elements, which cost a hydration boundary at the very top of the most
 * visited page in the store for an animation nobody was waiting to see.
 */
export default function CatalogHero() {
  return (
    <section className="relative overflow-hidden px-5 pb-10 pt-28 sm:px-8 md:pt-36">
      <div
        aria-hidden
        className="krov-aura-wine pointer-events-none absolute -top-48 left-1/4 h-[26rem] w-[26rem] opacity-60"
      />

      <div className="relative mx-auto max-w-7xl">
        <p className="krov-eyebrow">La colección</p>

        <h1
          className="mt-6 max-w-3xl text-4xl leading-[1.02] text-krov-bone sm:text-5xl md:text-6xl"
          style={{ fontFamily: serif }}
        >
          Busca tu perfume
          <br />
          <span className="italic text-krov-blush">aquí</span>
        </h1>

        <p className="mt-7 max-w-lg text-sm leading-relaxed text-krov-ash">
          Busca por nombre, marca o usa los filtros para mayor facilidad.
        </p>
      </div>
    </section>
  );
}
