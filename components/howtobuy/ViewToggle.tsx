"use client";

import { Monitor, Smartphone } from "lucide-react";
import type { FlowView } from "./steps";

const OPTIONS: Array<{
  value: FlowView;
  label: string;
  icon: typeof Monitor;
}> = [
  { value: "desktop", label: "Computadora", icon: Monitor },
  { value: "mobile", label: "Celular", icon: Smartphone },
];

interface ViewToggleProps {
  value: FlowView;
  onChange: (view: FlowView) => void;
}

/**
 * Segmented control switching the journey between the desktop and mobile
 * screenshots. The step copy is identical across both (see steps.ts) — only the
 * visuals change.
 *
 * Built on real radio inputs rather than buttons so it is a single tab stop with
 * arrow-key navigation and is announced as one grouped choice, which is what a
 * segmented control should be.
 */
export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <fieldset className="mx-auto w-fit">
      <legend className="sr-only">Elige cómo estás navegando</legend>

      <div className="relative flex items-center gap-1 rounded-full border border-krov-smoke bg-white/[0.03] p-1 backdrop-blur-sm">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;

          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-krov-blood/60 ${
                active
                  ? "bg-krov-blood text-black"
                  : "text-white/55 hover:text-white"
              }`}
            >
              <input
                type="radio"
                name="howtobuy-view"
                value={option.value}
                checked={active}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <Icon size={15} strokeWidth={1.6} aria-hidden="true" />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
