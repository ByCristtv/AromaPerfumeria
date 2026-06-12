"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

export interface GalleryImage {
  url: string;
  position: number;
  alt_text: string | null;
  variant_id?: string | null;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
  /** Currently selected variant; the main image follows it when it changes. */
  activeVariantId?: string;
}

const PLACEHOLDER = "/placeholder.png";

export default function ProductGallery({
  images,
  productName,
  activeVariantId,
}: ProductGalleryProps) {
  const safeImages = useMemo<GalleryImage[]>(() => {
    const sorted = [...images].sort((a, b) => a.position - b.position);
    return sorted.length > 0
      ? sorted
      : [{ url: PLACEHOLDER, position: 0, alt_text: productName, variant_id: null }];
  }, [images, productName]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);

  // When the selected variant changes, jump the main image to that variant's
  // own image (if it has one). Manual thumbnail clicks still override until the
  // next variant change. Falls back to leaving the current image in place.
  useEffect(() => {
    if (!activeVariantId) return;
    const idx = safeImages.findIndex(
      (img) => img.variant_id === activeVariantId
    );
    if (idx >= 0) setActiveIdx(idx);
  }, [activeVariantId, safeImages]);

  const active = safeImages[activeIdx] ?? safeImages[0];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ on: true, x, y });
  };

  return (
    <div className="md:sticky md:top-28">
      {/* Main frame */}
      <div className="relative">
        {/* Gold halo behind the bottle */}
        <div
          aria-hidden
          className="absolute inset-0 -m-6 rounded-4xl opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(circle at 50% 60%, rgba(201,169,110,0.28), transparent 70%)",
          }}
        />

        <motion.div
          ref={frameRef}
          onMouseMove={onMove}
          onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
          className="group relative aspect-square overflow-hidden rounded-[1.75rem] border border-black/5 bg-linear-to-b from-white via-white to-[#fafaf7] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.25)]"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Gold animated border */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[1.75rem] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            style={{
              padding: "1px",
              background:
                "linear-gradient(135deg, rgba(201,169,110,0.0), rgba(201,169,110,0.55), rgba(201,169,110,0.0))",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={active.url}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={active.url}
                alt={active.alt_text || productName}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-contain p-8 transition-transform duration-500 ease-out will-change-transform"
                style={{
                  transform: zoom.on ? "scale(1.6)" : "scale(1)",
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Corner ornaments */}
          <Corner className="top-4 left-4" />
          <Corner className="top-4 right-4 rotate-90" />
          <Corner className="bottom-4 right-4 rotate-180" />
          <Corner className="bottom-4 left-4 -rotate-90" />
        </motion.div>
      </div>

      {/* Thumbnails */}
      {safeImages.length > 1 && (
        <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
          {safeImages.map((img, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={img.url + i}
                type="button"
                onClick={() => setActiveIdx(i)}
                aria-label={`Imagen ${i + 1}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                <span
                  className="absolute inset-0 rounded-xl transition-all duration-300"
                  style={{
                    boxShadow: isActive
                      ? "0 0 0 1.5px #c9a96e, 0 6px 18px -8px rgba(201,169,110,0.6)"
                      : "0 0 0 1px rgba(0,0,0,0.08)",
                  }}
                />
                <Image
                  src={img.url}
                  alt={img.alt_text || `${productName} ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-contain p-1.5"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute h-5 w-5 ${className}`}
      style={{
        borderTop: "1px solid #c9a96e",
        borderLeft: "1px solid #c9a96e",
        opacity: 0.55,
      }}
    />
  );
}
