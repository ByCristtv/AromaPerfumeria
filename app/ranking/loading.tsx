import { RankingBoardSkeleton } from "@/components/ranking/RankingBoard";
import { RANKING_TOP_COUNT } from "@/types/ranking";

/**
 * Shown while the leaderboard is fetched server-side. Mirrors the real page's
 * layout exactly — same container, same header rhythm, same row metrics — so
 * the board resolves in place rather than shifting the page under the reader.
 *
 * The static copy (eyebrow, title, caption) is rendered for real rather than as
 * a grey block: it is known before the query runs, so withholding it would be a
 * placeholder standing in for content we already have.
 */
export default function RankingLoading() {
  return (
    <div className="relative min-h-screen bg-krov-void">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-krov-ink via-krov-void to-krov-void"
      />

      <div className="relative mx-auto max-w-3xl px-5 pt-28 pb-24 sm:px-8 md:pt-36">
        <header className="text-center">
          <p className="krov-eyebrow mb-5">Ranking</p>
          <h1 className="krov-display text-4xl text-krov-bone md:text-6xl">
            Top {RANKING_TOP_COUNT}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-krov-ash">
            Las {RANKING_TOP_COUNT} personas con más experiencia. Se gana XP con
            cada pedido recibido, y el rango sale de ese total.
          </p>
        </header>

        <div className="mt-12 sm:mt-16">
          <RankingBoardSkeleton />
        </div>
      </div>
    </div>
  );
}
