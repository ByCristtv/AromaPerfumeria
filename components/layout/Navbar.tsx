"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMounted } from "@/hooks/useIsMounted";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Catálogo", href: "/products" },
  { label: "Contactanos", href: "/contact" },
  { label: "Como Comprar", href: "/howtobuy" },
  { label: "Sobre Nosotros", href: "/about" },
] as const;

const SERIF = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const mounted = useIsMounted();
  const isAdmin = useIsAdmin();
  const { isAuthenticated, isLoading: authLoading } = useAuthUser();
  const totalItems = useCartStore((state) =>
    state.cart.reduce((acc, item) => acc + item.quantity, 0)
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the mobile drawer on route-ish interactions and lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const cartBadge = mounted ? totalItems : 0;

  return (
    <>
      {/*
        No entrance animation, by design.

        The previous version initialised `isVisible=false` and flipped it inside
        requestAnimationFrame. rAF does not run while `document.visibilityState`
        is "hidden", so the primary navigation stayed at opacity:0 until the tab
        was focused. Re-implementing the same fade in CSS has the identical flaw —
        a hidden document freezes animation timelines at t=0.

        A fixed site header is the one element that must never wait on anything to
        become visible, and fading in the main nav costs perceived performance for
        no real gain. It simply renders.
      */}
      {/*
        The header is a single fixed bar pinned flush to the top of the viewport.

        A "utility bar" (rotating brand promises) used to sit ABOVE this nav and
        collapse on scroll via a max-height transition. Because it was a separate
        element the nav rode on top of, the collapse animation briefly left a gap
        above the nav through which page content flashed — the reported glitch.
        Removing it entirely leaves nothing that can open a gap: the nav is now
        the topmost element and is always attached to `top: 0`.
      */}
      <header
        className="fixed top-0 left-0 w-full z-50"
        style={{ fontFamily: SERIF }}
      >
        {/* ──────── Main bar ──────── */}
        <nav
          className={`bg-black transition-shadow duration-500 ${
            scrolled ? "shadow-[0_2px_30px_rgba(0,0,0,0.6)]" : ""
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            {/*
              Three-column grid rather than flex-between: it lets the navigation
              sit optically centred under the wordmark regardless of how wide the
              right-hand actions get — the editorial layout luxury houses use,
              and the main thing that stops this reading as a stock template.
            */}
            <div className="grid grid-cols-[auto_1fr_auto] items-center h-18 gap-6">
              {/* Wordmark */}
              <Link href="/" className="shrink-0 group">
                <span className="flex flex-col leading-none select-none">
                  <span className="text-white tracking-[0.35em] text-xl sm:text-2xl font-light transition-all duration-500 group-hover:tracking-[0.42em]">
                    AROMA
                  </span>
                  <span className="text-[#c9a96e] text-[9px] tracking-[0.25em] font-light italic mt-0.5">
                    Luxury Fragrance
                  </span>
                </span>
              </Link>

              {/* Centred navigation */}
              <ul className="hidden lg:flex items-center justify-center gap-9">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <NavLink href={link.href} label={link.label} />
                  </li>
                ))}
                {isAdmin && (
                  <li>
                    <NavLink href="/admin" label="Administrar" accent />
                  </li>
                )}
              </ul>

              {/* Actions */}
              <div className="hidden lg:flex items-center gap-6 shrink-0">
                <CartLink count={cartBadge} />
                <span className="h-5 w-px bg-white/15" />
                <AuthActions
                  isAuthenticated={isAuthenticated}
                  isLoading={authLoading}
                />
              </div>

              {/* Mobile hamburger */}
              <button
                className="lg:hidden justify-self-end flex flex-col gap-1.5 p-2"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Abrir menú"
                aria-expanded={menuOpen}
              >
                <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
              </button>
            </div>
          </div>

          {/* Hairline */}
          <div className="h-px w-full bg-linear-to-r from-transparent via-[#c9a96e]/40 to-transparent" />
        </nav>

        {/* ──────── Mobile drawer ──────── */}
        <div
          className={`lg:hidden overflow-hidden bg-black transition-[max-height,opacity] duration-500 ease-in-out ${
            menuOpen ? "max-h-128 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-6 pt-5 pb-8">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block py-3.5 text-white/70 hover:text-white text-xs tracking-[0.22em] uppercase border-b border-white/5 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAdmin && (
                <li>
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3.5 text-[#c9a96e] text-xs tracking-[0.22em] uppercase border-b border-white/5"
                  >
                    Administrar
                  </Link>
                </li>
              )}
            </ul>

            <div className="mt-7 flex flex-col gap-3">
              {authLoading ? null : isAuthenticated ? (
                <MobileAction
                  href="/profile"
                  label="Mi Perfil"
                  onClick={() => setMenuOpen(false)}
                  primary
                />
              ) : (
                <>
                  <MobileAction
                    href="/login"
                    label="Iniciar sesión"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MobileAction
                    href="/register"
                    label="Registrarse"
                    onClick={() => setMenuOpen(false)}
                    primary
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Floating mobile cart */}
      {mounted && (
        <Link
          href="/cart"
          aria-label={`Carrito, ${cartBadge} artículos`}
          className="floating-cart fixed bottom-6 right-6 z-50 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-[#c9a96e] shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-95"
        >
          <BagIcon className="w-6 h-6 text-black" />
          {cartBadge > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-[#c9a96e] text-[10px] font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
              {cartBadge}
            </span>
          )}
        </Link>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guests get a clear two-step entry (sign in / register) instead of the old
 * ambiguous "MI CUENTA", which promised an account the visitor may not have.
 * Renders nothing until auth resolves — a flash of "Iniciar sesión" for a
 * signed-in user reads as being logged out, which is worse than a brief gap.
 */
function AuthActions({
  isAuthenticated,
  isLoading,
}: {
  isAuthenticated: boolean;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <span className="w-28 h-9" aria-hidden />;
  }

  if (isAuthenticated) {
    return (
      <Link
        href="/profile"
        className="px-5 py-2.5 border border-[#c9a96e]/60 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#c9a96e] hover:text-black"
      >
        Mi Perfil
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-[10px] tracking-[0.2em] uppercase text-white/60 hover:text-white transition-colors duration-300"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="px-5 py-2.5 border border-[#c9a96e]/60 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#c9a96e] hover:text-black"
      >
        Registrarse
      </Link>
    </div>
  );
}

function NavLink({
  href,
  label,
  accent,
}: {
  href: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative text-[10px] tracking-[0.22em] uppercase transition-colors duration-300 group py-1 ${
        accent ? "text-[#c9a96e]" : "text-white/65 hover:text-white"
      }`}
    >
      {label}
      <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-[#c9a96e] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

function CartLink({ count }: { count: number }) {
  return (
    <Link
      href="/cart"
      aria-label={`Carrito, ${count} artículos`}
      className="relative text-white/65 hover:text-white transition-colors duration-200"
    >
      <BagIcon className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2 bg-[#c9a96e] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}

function MobileAction({
  href,
  label,
  onClick,
  primary,
}: {
  href: string;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`w-full text-center py-3 text-[10px] tracking-[0.22em] uppercase transition-all duration-300 ${
        primary
          ? "bg-[#c9a96e] text-black hover:bg-[#c9a96e]/90"
          : "border border-white/20 text-white/75 hover:border-[#c9a96e]/60 hover:text-[#c9a96e]"
      }`}
    >
      {label}
    </Link>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
      />
    </svg>
  );
}
