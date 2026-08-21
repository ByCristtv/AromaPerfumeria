"use client";

/**
 * Preset-button date range picker for the analytics dashboard.
 *
 * Value semantics:
 *   - Date | null
 *   - null = "all-time" (RPC omits p_since → returns lifetime totals)
 *   - Date = lower bound; RPC filters orders with created_at >= since
 *
 * Designed for read-only analytics. If you ever need a calendar picker,
 * extract the buttons into a separate `<PresetButton>` and add a popover.
 */

export type DatePreset = "7d" | "30d" | "90d" | "all";

interface Props {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}

const PRESETS: { id: DatePreset; label: string }[] = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "90d", label: "90 días" },
  { id: "all", label: "Todo" },
];

export default function DateRangePicker({ value, onChange }: Props) {
  return (
    <div
      role="group"
      aria-label="Rango de fechas"
      className="inline-flex rounded-none border border-krov-blood/30 bg-krov-graphite p-0.5"
    >
      {PRESETS.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            aria-pressed={active}
            className={
              "px-3 py-1.5 text-xs uppercase tracking-wider rounded-none transition " +
              (active
                ? "bg-krov-blood text-black font-semibold"
                : "text-krov-ash hover:text-krov-bone")
            }
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Convert a DatePreset to the Date passed to the analytics hooks.
 * Co-located so caller doesn't have to duplicate the mapping.
 */
export function presetToDate(preset: DatePreset): Date | null {
  switch (preset) {
    case "7d":
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    case "all":
      return null;
  }
}
