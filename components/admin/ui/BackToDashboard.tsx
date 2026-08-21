import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackToDashboardProps {
  /** Destination for the back link. Defaults to the admin dashboard. */
  href?: string;
  /** Visible label. Defaults to "Volver al panel". */
  label?: string;
  className?: string;
}

/**
 * Reusable "back" link for the admin area. Defaults to the main dashboard
 * (`/admin`) but accepts a custom target so nested pages (e.g. an order detail)
 * can point at their parent list while keeping identical styling everywhere.
 */
export default function BackToDashboard({
  href = "/admin",
  label = "Volver al panel",
  className = "",
}: BackToDashboardProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-krov-ash transition-colors hover:text-krov-rose ${className}`}
    >
      <ArrowLeft
        size={15}
        aria-hidden
        className="transition-transform duration-300 group-hover:-translate-x-1"
      />
      {label}
    </Link>
  );
}
