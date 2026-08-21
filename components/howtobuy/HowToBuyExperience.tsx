"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import HowToBuyHero from "./HowToBuyHero";
import SectionHeading from "./SectionHeading";
import StepCard from "./StepCard";
import StepConnector from "./StepConnector";
import SuccessCard from "./SuccessCard";
import ViewToggle from "./ViewToggle";
import {
  MAIN_STEPS,
  OPTIONAL_STEPS,
  resolveSteps,
  type FlowView,
  type ResolvedStep,
} from "./steps";

function StepList({ steps }: { steps: ResolvedStep[] }) {
  return (
    <div className="mt-16 flex flex-col">
      {steps.map((step, i) => (
        <React.Fragment key={step.number}>
          <StepCard step={step} index={i} />
          {i < steps.length - 1 && <StepConnector />}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Full premium onboarding journey for "Cómo Comprar". */
export default function HowToBuyExperience() {
  // Default to the journey matching the device the reader is actually on — a
  // phone visitor shouldn't have to switch to see their own screenshots.
  //
  // Read through useSyncExternalStore rather than an effect: matchMedia IS an
  // external store, and this keeps the default out of render-cascading setState.
  // The subscribe callback is intentionally inert, so a resize/rotation never
  // yanks the flow out from under someone mid-scroll — this is an initial
  // preference, not a responsive layout.
  const prefersMobileFlow = useSyncExternalStore(
    () => () => {},
    () => window.matchMedia("(max-width: 1023px)").matches,
    () => false // server render: assume desktop
  );

  // An explicit choice always beats the device default.
  const [override, setOverride] = useState<FlowView | null>(null);
  const view: FlowView = override ?? (prefersMobileFlow ? "mobile" : "desktop");

  const optionalSteps = useMemo(
    () => resolveSteps(OPTIONAL_STEPS, view),
    [view]
  );
  const mainSteps = useMemo(() => resolveSteps(MAIN_STEPS, view), [view]);

  return (
    <div className="relative bg-krov-void">
      {/* Subtle vertical texture behind the whole journey */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-krov-ink via-krov-void to-krov-void"
      />

      <div className="relative">
        <HowToBuyHero />

        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* ──────── Device flow switch ──────── */}
          <div className="pt-10 md:pt-14">
            <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-white/35">
              ¿Cómo estás navegando?
            </p>
            <ViewToggle value={view} onChange={setOverride} />
          </div>

          {/* Optional but recommended */}
          <section
            aria-labelledby="optional-heading"
            className="pt-12 md:pt-20"
          >
            <div id="optional-heading">
              <SectionHeading
                eyebrow="Opcional pero recomendado"
                title="Comienza con"
                emphasis="ventaja"
                description="Estos pasos no son obligatorios, pero hacen tu experiencia más rápida, segura y personalizada."
              />
            </div>
            <StepList steps={optionalSteps} />
          </section>

          {/* Elegant divider */}
          <div
            aria-hidden="true"
            className="mx-auto my-20 flex max-w-xs items-center gap-4 md:my-28"
          >
            <span className="h-px flex-1 bg-linear-to-r from-transparent to-krov-blood/30" />
            <span className="h-1.5 w-1.5 rotate-45 bg-krov-blood/60" />
            <span className="h-px flex-1 bg-linear-to-l from-transparent to-krov-blood/30" />
          </div>

          {/* Start shopping */}
          <section aria-labelledby="shopping-heading">
            <div id="shopping-heading">
              <SectionHeading
                eyebrow="Comienza a comprar"
                title="El recorrido hacia tu"
                emphasis="fragancia"
                description="Sigue estos pasos para descubrir, elegir y recibir tu perfume con total tranquilidad."
              />
            </div>
            <StepList steps={mainSteps} />
          </section>

          {/* Success */}
          <div className="py-24 md:py-32">
            <SuccessCard />
          </div>
        </div>
      </div>
    </div>
  );
}
