"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FOOTER_STATS } from "./footerData";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

/** Animated count-up that runs once when scrolled into view. */
function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display.toLocaleString("es-CR")}
      {suffix}
    </span>
  );
}

export default function FooterStats() {
  return (
    <section className="bg-[#080808]">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20 lg:px-10">
        <div className="grid grid-cols-2 gap-y-12 divide-white/10 lg:grid-cols-4 lg:divide-x">
          {FOOTER_STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 text-center"
            >
              <p
                className="text-3xl text-[#c9a96e] sm:text-4xl md:text-5xl"
                style={{ fontFamily: serif }}
              >
                {stat.value !== null ? (
                  <CountUp value={stat.value} suffix={stat.suffix ?? ""} />
                ) : (
                  <span className="text-2xl sm:text-3xl md:text-4xl">{stat.display}</span>
                )}
              </p>
              <p
                className="mt-3 text-xs uppercase tracking-[0.2em] text-white/55 md:text-sm"
                style={{ fontFamily: serif }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
