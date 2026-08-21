import { PAYMENT_METHODS } from "./footerData";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

/** Minimal closing bar: copyright · statement · payment methods. */
export default function FooterBottomBar() {
  return (
    <div className="border-t border-white/8 bg-[#060606]">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-8 text-center lg:flex-row lg:justify-between lg:gap-4 lg:px-10 lg:text-left">
        {/* Left — copyright */}
        <p
          className="order-3 text-xs text-white/40 lg:order-1"
          style={{ fontFamily: serif }}
        >
          © 2026 KROV Perfumería. Todos los derechos reservados.
        </p>

        {/* Center — statement */}
        <p
          className="order-1 text-xs italic text-krov-rose/70 lg:order-2"
          style={{ fontFamily: serif }}
        >
          Autenticidad, calidad y pasión por la perfumería.
        </p>

        {/* Right — payment methods */}
        <ul className="order-2 flex flex-wrap items-center justify-center gap-2.5 lg:order-3">
          {PAYMENT_METHODS.map((method) => (
            <li
              key={method}
              className="rounded-md border border-white/12 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-white/55 transition-all duration-300 hover:border-krov-blood/50 hover:text-krov-rose"
            >
              {method}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
