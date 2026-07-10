const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

/** Luxury skeleton shown while a catalog page is fetched server-side. */
export default function CatalogLoading() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#0c0b0a] via-[#0a0a0a] to-[#080808]"
      />

      <div className="relative">
        {/* Hero placeholder */}
        <div className="px-5 pt-28 pb-12 text-center sm:px-8 md:pt-36">
          <p
            className="mb-5 text-xs uppercase tracking-[0.4em] text-[#c9a96e]"
            style={{ fontFamily: serif }}
          >
            La colección
          </p>
          <div className="mx-auto h-12 w-72 max-w-full animate-pulse rounded bg-white/5 md:h-16" />
          <div className="mx-auto mt-5 h-4 w-96 max-w-full animate-pulse rounded bg-white/5" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
          {/* Toolbar placeholder */}
          <div className="h-20 animate-pulse rounded-2xl border border-white/8 bg-[#0d0d0d]/85" />

          {/* Grid placeholder */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-white/8 bg-[#101010]"
              >
                <div className="aspect-[4/5] animate-pulse bg-gradient-to-b from-[#efe9df] to-[#e2dccf]" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
                  <div className="mt-3 h-9 w-full animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
