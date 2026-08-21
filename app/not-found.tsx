import Link from "next/link";
import KrovLogo from "@/components/brand/KrovLogo";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/**
 * Global 404.
 *
 * The app had none, so every mistyped URL fell through to Next's built-in page:
 * black Helvetica on white, in English-ish, with no way back into the store —
 * the one screen guaranteed to be seen by someone who is already lost, and the
 * only screen in the product that was not KROV.
 *
 * Product-specific misses keep their own richer page at
 * `app/products/[slug]/not-found.tsx`; this catches everything else.
 */
export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-krov-void px-5 pb-20 pt-28">
      <div
        aria-hidden
        className="krov-aura-wine pointer-events-none absolute left-1/2 top-1/3 h-[30rem] w-[30rem] -translate-x-1/2 opacity-60"
      />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <KrovLogo tone="light" width={150} />

        <p
          className="mt-12 text-7xl leading-none text-krov-blood sm:text-8xl"
          style={{ fontFamily: serif }}
        >
          404
        </p>

        <h1
          className="mt-6 text-3xl leading-tight text-krov-bone sm:text-4xl"
          style={{ fontFamily: serif }}
        >
          Acá no hay <span className="italic text-krov-blush">nada</span>
        </h1>

        <p className="mt-5 text-sm leading-relaxed text-krov-ash">
          La página que buscabas no existe o cambió de lugar. La colección sigue
          donde la dejaste.
        </p>

        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href="/products" className="krov-btn-primary justify-center">
            Ver la colección
          </Link>
          <Link href="/" className="krov-btn-outline justify-center">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
