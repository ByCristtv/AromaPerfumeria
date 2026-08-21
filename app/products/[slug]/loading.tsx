/**
 * Product detail skeleton.
 *
 * It mirrors the real page's geometry exactly — linen plate on the left, type
 * column on the right, three perks under the CTA — so the layout does not jump
 * when content arrives. The plate keeps its light fill because the finished
 * page has a light plate; a dark placeholder that turns luminous is a more
 * jarring transition than no placeholder at all.
 *
 * Blocks are `krov-graphite` on the void rather than the old `black/5` on
 * white, which was invisible against the redesigned ground.
 */
export default function Loading() {
  return (
    <div className="relative min-h-screen bg-krov-void pb-24 pt-28">
      <div
        aria-hidden
        className="krov-aura-wine pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] opacity-70"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-10 h-2.5 w-52 animate-pulse bg-krov-graphite" />

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
          {/* Plate */}
          <div className="aspect-square animate-pulse bg-gradient-to-b from-krov-linen/25 to-krov-linen-deep/15" />

          {/* Purchase column */}
          <div className="flex flex-col gap-5">
            <div className="h-2.5 w-28 animate-pulse bg-krov-graphite" />
            <div className="h-11 w-3/4 animate-pulse bg-krov-graphite" />
            <div className="flex gap-2.5">
              <div className="h-7 w-24 animate-pulse bg-krov-graphite" />
              <div className="h-7 w-20 animate-pulse bg-krov-graphite" />
            </div>
            <div className="mt-3 h-9 w-44 animate-pulse bg-krov-graphite" />

            <div className="mt-4 h-px w-full bg-krov-smoke" />

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse bg-krov-graphite" />
              ))}
            </div>

            <div className="mt-4 h-14 w-full animate-pulse bg-krov-graphite" />

            <div className="mt-2 grid grid-cols-3 gap-px border-y border-krov-smoke">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse bg-krov-graphite/40" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
