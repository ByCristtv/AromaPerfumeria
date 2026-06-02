export default function Loading() {
  return (
    <div className="relative pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-3 w-48 rounded bg-black/5 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          <div className="aspect-square rounded-[1.75rem] bg-gradient-to-b from-black/[0.04] via-black/[0.06] to-black/[0.03] animate-pulse" />
          <div className="flex flex-col gap-5">
            <div className="h-3 w-32 rounded bg-black/10 animate-pulse" />
            <div className="h-12 w-3/4 rounded bg-black/[0.06] animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-black/[0.05] animate-pulse" />
            <div className="h-10 w-44 rounded bg-black/[0.05] animate-pulse mt-4" />
            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-black/[0.04] animate-pulse"
                />
              ))}
            </div>
            <div className="h-14 w-full rounded-full bg-black/[0.07] animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
