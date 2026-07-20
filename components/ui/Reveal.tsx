'use client';
import { useEffect, useRef, useState } from 'react';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
};

export default function Reveal({
  children,
  className = '',
  rootMargin = '0px 0px -10% 0px',
  threshold = 0.12,
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Defensive fallback for the (now vanishingly rare) environments that
      // lack IntersectionObserver: reveal immediately so content is never
      // stuck hidden. This fires at most once and cannot cascade, so the
      // synchronous setState is intentional here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once && el) obs.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { root: null, rootMargin, threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin, threshold, once]);

  return (
    <div ref={ref} className={`reveal-fx ${visible ? 'reveal-fx--visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
