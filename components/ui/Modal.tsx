"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Optional caption under the title. */
  subtitle?: string;
  children: ReactNode;
  /** Tailwind max-width class for the panel. Defaults to `max-w-md`. */
  maxWidthClassName?: string;
  /** When false, clicking the backdrop won't close (e.g. while saving). */
  closeOnBackdrop?: boolean;
}

/**
 * Accessible, animated modal dialog rendered in a portal.
 *
 * - Locks background scroll while open.
 * - Closes on ESC and on backdrop click (unless `closeOnBackdrop=false`).
 * - Traps initial focus on the panel; restores focus to the trigger on close.
 * - role="dialog" + aria-modal; the title (if any) labels the dialog.
 *
 * Visual language matches the storefront: dark glass panel, gold accents.
 */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-md",
  closeOnBackdrop = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // ESC to close + focus management.
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    // Focus the panel on the next frame so the animation has mounted it.
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(raf);
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  // Render nothing on the server; portal needs document.
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden
            onClick={closeOnBackdrop ? onClose : undefined}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${maxWidthClassName} max-h-[90vh] overflow-y-auto rounded-2xl border border-[#c9a96e]/35 bg-black/90 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.6)] outline-none`}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                  )}
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-white/50">{subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="-mr-1 -mt-1 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M6 6l12 12M18 6L6 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            )}

            <div className="px-6 py-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
