import type { Metadata } from "next";
import Link from "next/link";
import { getTopRanking } from "@/features/ranking/getRanking";
import RankingBoard, {
  RankingEmptyState,
  RankingErrorState,
} from "@/components/ranking/RankingBoard";
import { RANKING_TOP_COUNT } from "@/types/ranking";

export const metadata: Metadata = {
  alternates: { canonical: "/ranking" },
  title: "Ranking",
  description:
    "Los 10 clientes con más experiencia en KROV Perfumería. Gana XP con cada pedido recibido y sube de rango.",
};

/**
 * The board is identical for every visitor, so it is cached and re-read at most
 * once a minute instead of on every request. Opting in or renaming yourself
 * doesn't wait out that window — the profile action calls
 * `revalidatePath("/ranking")`, so the change is visible immediately.
 */
export const revalidate = 60;

export default async function RankingPage() {
  const result = await getTopRanking();

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
          {result.status === "error" ? (
            <RankingErrorState />
          ) : result.entries.length === 0 ? (
            <RankingEmptyState />
          ) : (
            <RankingBoard entries={result.entries} />
          )}
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-krov-dust">
          Solo aparecen quienes lo activaron desde su perfil.{" "}
          <Link href="/profile" className="krov-underline text-krov-rose">
            Configura tu participación
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
