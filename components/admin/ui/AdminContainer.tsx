import type { ReactNode } from "react";

interface AdminContainerProps {
  children: ReactNode;
  /**
   * Content width. `default` (7xl) suits list/table dashboards; `narrow` (6xl)
   * suits focused forms and detail pages.
   */
  width?: "default" | "narrow";
  className?: string;
}

const WIDTHS = {
  default: "max-w-7xl",
  narrow: "max-w-6xl",
} as const;

/**
 * Standard admin content shell: centers the page, applies the shared
 * horizontal padding and the top offset that clears the fixed navbar
 * (`h-20`), and bottom breathing room. The page background, ambient glow and
 * min-height live in `app/admin/layout.tsx` so every admin route shares them.
 */
export default function AdminContainer({
  children,
  width = "default",
  className = "",
}: AdminContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-5 pb-16 pt-28 sm:px-8 lg:px-10 ${WIDTHS[width]} ${className}`}
    >
      {children}
    </div>
  );
}
