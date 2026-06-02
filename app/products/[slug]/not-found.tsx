import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-28 pb-20">
      <div className="text-center max-w-md">
        <p
          className="text-[11px] tracking-[0.32em] uppercase"
          style={{ color: "#c9a96e" }}
        >
          Producto no encontrado
        </p>
        <h1
          className="mt-4 text-4xl font-light text-black"
          style={{ fontFamily: '"Cormorant Garamond", "Garamond", serif' }}
        >
          Esta fragancia se ha desvanecido
        </h1>
        <p className="mt-4 text-sm text-black/55">
          Tal vez el producto fue retirado del catálogo o el enlace no es
          correcto. Te invitamos a explorar nuestra colección.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 px-7 py-3 text-[11px] font-semibold tracking-[0.22em] uppercase text-white rounded-full transition-transform hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
            boxShadow:
              "0 14px 30px -14px rgba(201,169,110,0.5), 0 0 0 1px rgba(201,169,110,0.3)",
          }}
        >
          Volver al catálogo
        </Link>
      </div>
    </main>
  );
}
