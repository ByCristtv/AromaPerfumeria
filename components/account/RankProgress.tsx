"use client";

import { motion } from "framer-motion";
import { getRankInfo } from "@/lib/rank";

/** Group digits with thousands separators, e.g. 2450 → "2,450". */
function formatXp(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.floor(value)));
}

interface RankProgressProps {
  experiencePoints: number;
}

/**
 * Rank + XP progression card for the account page. Pure presentation — all
 * thresholds and math come from {@link getRankInfo}, so ranks are never stored,
 * only derived from `experience_points`.
 */
export default function RankProgress({ experiencePoints }: RankProgressProps) {
  const info = getRankInfo(experiencePoints);
  const isMaxRank = info.nextRank === null;

  return (
    <div className="rounded-2xl border border-[#c9a96e]/30 bg-gradient-to-br from-[#c9a96e]/10 to-transparent p-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-white/50 text-[11px] uppercase tracking-wider mb-1">
            Rango actual
          </p>
          <p
            className="text-[#c9a96e] text-2xl font-semibold leading-none"
            style={{ fontFamily: "'Cormorant Garamond', 'Garamond', serif" }}
          >
            {info.currentRank}
          </p>
        </div>
        <p className="text-white text-sm font-medium tabular-nums">
          {formatXp(info.currentXP)} XP
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={info.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          isMaxRank
            ? "Rango máximo alcanzado"
            : `Progreso hacia ${info.nextRank}`
        }
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#c9a96e]/70 to-[#c9a96e]"
          initial={{ width: 0 }}
          animate={{ width: `${info.progressPercent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Next-rank caption */}
      {isMaxRank ? (
        <p className="mt-3 text-center text-xs font-medium tracking-wide text-[#c9a96e]">
          Rango máximo alcanzado
        </p>
      ) : (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-white/60">
            Próximo rango:{" "}
            <span className="text-white font-medium">{info.nextRank}</span>
          </span>
          <span className="text-white/60 tabular-nums">
            {formatXp(info.xpRemaining)} XP restantes
          </span>
        </div>
      )}
    </div>
  );
}
