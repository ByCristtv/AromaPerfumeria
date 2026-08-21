import Link from "next/link";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * A dead product link is a dead end, so this page does one job: get the visitor
 * back into the collection. The line about the fragrance having vanished keeps
 * the brand's voice without pretending the error did not happen.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-krov-void px-5 pb-20 pt-28">
      <div
        aria-hidden
        className="krov-aura-wine pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[28rem] -translate-x-1/2 opacity-60"
      />

      <div className="relative max-w-md text-center">
        <p className="krov-eyebrow">Producto no encontrado</p>

        <h1
          className="mt-6 text-4xl leading-tight text-krov-bone sm:text-5xl"
          style={{ fontFamily: serif }}
        >
          Esta fragancia se{" "}
          <span className="italic text-krov-blush">desvaneció</span>
        </h1>

        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-krov-ash">
          El producto salió del catálogo o el enlace no es correcto. La colección
          sigue completa del otro lado.
        </p>

        <Link href="/products" className="krov-btn-primary mt-9">
          Volver a la colección
        </Link>
      </div>
    </div>
  );
}
