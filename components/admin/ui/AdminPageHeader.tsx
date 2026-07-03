import type { ReactNode } from "react";
import BackToDashboard from "./BackToDashboard";
import { adminSerif } from "./styles";

interface AdminPageHeaderProps {
  /** Small gold eyebrow above the title. Pass `null` to hide it. */
  eyebrow?: string | null;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions (buttons, pickers). */
  actions?: ReactNode;
  /** Whether to render the back link. Hidden on the dashboard root. */
  showBack?: boolean;
  /** Back-link target. Defaults to the dashboard (`/admin`). */
  backHref?: string;
  /** Back-link label. Defaults to "Volver al panel". */
  backLabel?: string;
}

/**
 * Unified admin page header. Renders an optional back link, a gold eyebrow, a
 * serif title that matches the storefront, an optional description, optional
 * right-aligned actions, and a gold divider underline.
 *
 * Centralizing this keeps every admin section visually identical and removes
 * the per-page header markup that had drifted apart (different paddings,
 * weights, and divider treatments).
 */
export default function AdminPageHeader({
  eyebrow = "Administración",
  title,
  description,
  actions,
  showBack = true,
  backHref,
  backLabel,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-8">
      {showBack && (
        <div className="mb-5">
          <BackToDashboard href={backHref} label={backLabel} />
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <span
              className="mb-3 inline-flex items-center rounded-full border border-[#c9a96e]/30 bg-[#c9a96e]/[0.06] px-3.5 py-1.5 text-[10px] uppercase tracking-[0.35em] text-[#c9a96e]"
              style={{ fontFamily: adminSerif }}
            >
              {eyebrow}
            </span>
          )}

          <h1
            className="text-3xl leading-tight text-[#ececec] sm:text-4xl"
            style={{ fontFamily: adminSerif }}
          >
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a5a5a5] sm:text-[0.95rem]">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-3 self-start sm:self-end">
            {actions}
          </div>
        )}
      </div>

      <div className="mt-6 h-px w-full bg-gradient-to-r from-[#c9a96e]/40 via-[#c9a96e]/10 to-transparent" />
    </header>
  );
}
