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
    <div ref={ref} className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
