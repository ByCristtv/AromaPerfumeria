/**
 * Ambient backdrop for the product detail page.
 *
 * The page used to be white — an island of light inside an otherwise black
 * store, which broke the brand at the exact screen where the decision to buy is
 * made. It now sits on the same void as everything else, lit by two wine blooms
 * that echo the mark's two overlapping circles.
 *
 * Fixed and behind everything, pure CSS: no JS cost, no layout impact.
 */
export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-krov-void"
    >
      <div className="krov-aura-wine absolute -left-40 -top-40 h-[34rem] w-[34rem] opacity-70" />
      <div className="krov-aura absolute right-[-10rem] top-1/3 h-[30rem] w-[30rem] opacity-[0.13]" />
      {/* Faint dot matrix — structure under the darkness, so the ground reads
          as a considered surface rather than as an absence of one. */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,222,222,0.05) 1px, transparent 0)",
          backgroundSize: "34px 34px",
        }}
      />
    </div>
  );
}
