"use client";

/**
 * The shared visual primitives of /profile.
 *
 * These lived as private helpers inside ProfileView while it was the only file
 * that rendered account cards. They were lifted here unchanged the moment a
 * second file needed them (RankingSettingsCard), so every card on the page keeps
 * getting its surface, heading, inputs and modal footer from one place — the
 * alternative was a second copy of the same Tailwind strings drifting out of
 * sync with the first.
 *
 * Nothing about the markup or classes changed in the move.
 */

const INPUT_CLS =
  "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-krov-blood/60 focus:border-krov-blood/60 disabled:opacity-40";

// Native <select> reuses INPUT_CLS for its (dark) closed control, but the OS
// renders the open <option> list on its own surface — with the translucent
// `bg-white/5` above the options came out white-on-white and unreadable. Pin the
// options to a light background with near-black text (same treatment the
// checkout address selects already use) so the menu is legible; the closed
// control keeps the dark modal styling.
const SELECT_CLS = `${INPUT_CLS} [&>option]:bg-white [&>option]:text-gray-900`;

export { INPUT_CLS, SELECT_CLS };

/** The dark glass panel every account section sits on. */
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-krov-smoke bg-black/50 backdrop-blur-sm p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
      {children}
    </section>
  );
}

/** A card's small-caps title, with an optional caption and edit affordance. */
export function CardHeading({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-white/45">
          {title}
        </h2>
        {caption && <span className="text-[11px] text-white/25">{caption}</span>}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-krov-rose text-xs hover:underline shrink-0"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * A labelled form row.
 *
 * `htmlFor` is optional only because the original callers wrapped native inputs
 * that Tailwind styled positionally; pass it (with a matching `id`) for anything
 * new so the label is programmatically associated rather than just adjacent.
 */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-white/50 text-xs mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Cancel / Save footer shared by every edit modal on the page. */
export function ModalActions({
  onCancel,
  onSave,
  saving,
  saveDisabled = false,
}: {
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  /** Blocks Save for reasons other than an in-flight request. */
  saveDisabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-1">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="flex-1 rounded-lg border border-white/20 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || saveDisabled}
        className="flex-1 rounded-lg bg-krov-blood py-2.5 text-sm font-medium text-black transition hover:bg-krov-crimson disabled:opacity-50"
      >
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}

/** Small outlined chip used for statuses. */
export function Badge({ label }: { label: string }) {
  return (
    <span className="inline-block border border-white/15 px-2 py-0.5 text-[10px] tracking-wide uppercase text-white/55">
      {label}
    </span>
  );
}
