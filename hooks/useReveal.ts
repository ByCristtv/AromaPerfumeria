"use client";

import { useEffect, useRef } from "react";

const REVEAL_CLASS = "reveal-in";

/**
 * ONE IntersectionObserver for the entire page, shared by every revealing
 * element. Framer Motion's `whileInView` creates an observer per component;
 * the How-to-Buy journey had ~100 of them, which is a large part of why it
 * stuttered on budget hardware. A single observer with many targets is what the
 * API is designed for.
 *
 * Module-scoped so it survives remounts and is created lazily — importing this
 * file on the server does nothing.
 */
let sharedObserver: IntersectionObserver | null = null;
let failsafeArmed = false;

/**
 * Every element currently waiting to be revealed.
 *
 * Tracked explicitly rather than re-queried as `.reveal:not(.reveal-in)`,
 * because not every reveal target carries the `.reveal` class — StepConnector
 * is observed but styles its children (`.connector-line` / `.connector-dot`)
 * off the released parent instead. A selector-based failsafe silently skipped
 * those and left them stranded.
 */
const pending = new Set<Element>();

/** Reveal anything still waiting. Used only by the failsafe below. */
function revealAllPending(): void {
  for (const el of pending) el.classList.add(REVEAL_CLASS);
  pending.clear();
}

/**
 * Safety net for the one way this system can strand content invisible.
 *
 * IntersectionObserver requires layout/paint, so it does NOT fire while
 * `document.visibilityState === "hidden"` (verified: a background tab reports
 * zero callbacks). Normally harmless — focusing the tab resumes paint and the
 * observer fires — but nothing should be able to leave copy permanently at
 * opacity 0. If the observer hasn't reported while the page is genuinely
 * visible, everything is shown unconditionally.
 *
 * One timer for the page, not one per element.
 */
function armFailsafe(): void {
  if (failsafeArmed) return;

  if (document.visibilityState !== "visible") {
    // Nothing can reveal yet; re-arm once the tab is actually looked at.
    document.addEventListener("visibilitychange", armFailsafe, { once: true });
    return;
  }

  failsafeArmed = true;
  window.setTimeout(revealAllPending, 4000);
}

function getObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;

  sharedObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(REVEAL_CLASS);
        // Reveal is one-way; stop paying for anything already shown.
        pending.delete(entry.target);
        observer.unobserve(entry.target);
      }
    },
    // Fire slightly before the element is fully on screen so the transition has
    // already begun by the time the user is looking at it.
    { rootMargin: "0px 0px -8% 0px", threshold: 0.01 }
  );

  return sharedObserver;
}

/**
 * Attach to any element carrying the `reveal` class. Returns a ref.
 *
 *   const ref = useReveal<HTMLDivElement>();
 *   <div ref={ref} className="reveal">…</div>
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer support → show it. Content must never stay hidden because a
    // progressive enhancement was unavailable.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add(REVEAL_CLASS);
      return;
    }

    const observer = getObserver();
    pending.add(el);
    observer.observe(el);
    armFailsafe();

    return () => {
      pending.delete(el);
      observer.unobserve(el);
    };
  }, []);

  return ref;
}
