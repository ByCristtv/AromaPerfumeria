"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
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

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-4.5 h-4.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
      />
    </svg>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="relative text-[11px] tracking-[0.2em] uppercase text-white/70 hover:text-white transition-colors duration-300 group py-1"
      style={{ fontFamily: SERIF, letterSpacing: "0.15em" }}
    >
      {label}
      <span className="absolute bottom-0 left-0 h-px w-0 bg-[#c9a96e] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mounted = useIsMounted();
  const isAdmin = useIsAdmin();
  const totalItems = useCartStore((state) =>
    state.cart.reduce((acc, item) => acc + item.quantity, 0)
  );

  // Entrance animation: fade in on next frame so the transition runs.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Sticky-on-scroll behavior.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartBadge = mounted ? totalItems : 0;

  return (
    <>
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
      } ${
        scrolled
          ? "bg-black/95 backdrop-blur-md shadow-[0_2px_30px_rgba(0,0,0,0.6)]"
          : "bg-black"
      }`}
    >
      {/* Top accent line */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-[#c9a96e] to-transparent opacity-70" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="shrink-0 group">
            <div className="flex flex-col leading-none select-none">
              <span
                className="text-white tracking-[0.35em] text-2xl font-light transition-all duration-300 group-hover:tracking-[0.45em]"
                style={{ fontFamily: SERIF }}
              >
                AROMA
              </span>
              <span
                className="text-[#c9a96e] text-[10px] tracking-[0.25em] font-light italic -mt-0.5 transition-opacity duration-300 group-hover:opacity-80"
                style={{ fontFamily: SERIF }}
              >
                Luxury Fragrance
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink href={link.href} label={link.label} />
              </li>
            ))}
            {isAdmin && (
              <li>
                <NavLink href="/admin" label="Administrar" />
              </li>
            )}
          </ul>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-5">
            <span
              className="text-white/60 text-[10px] tracking-[0.15em] uppercase"
              style={{ fontFamily: SERIF }}
            >
              Carrito
            </span>
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-white/60 hover:text-white transition-colors duration-200"
            >
              <CartIcon />
              <span className="absolute -top-1.5 -right-1.5 bg-[#c9a96e] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartBadge}
              </span>
            </Link>

            <Link
              href="/login"
              className="ml-2 px-5 py-2 border font-semibold border-[#c9a96e]/60 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase hover:bg-[#c9a96e] hover:text-black transition-all duration-300"
              style={{ fontFamily: SERIF }}
            >
              MI CUENTA
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.25 p-2 group"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`block h-px w-6 bg-white transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent" />

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          menuOpen ? "max-h-100 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-black/98 border-t border-white/5 px-6 pt-4 pb-8">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link, i) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block py-3 text-white/70 hover:text-white text-sm tracking-[0.15em] uppercase border-b border-white/5 hover:border-[#c9a96e]/40 transition-all duration-200"
                  style={{ fontFamily: SERIF, transitionDelay: `${i * 40}ms` }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 mt-6">
            <span className="text-white/50">Carrito</span>

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative text-white/50 hover:text-white transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              <CartIcon />
              <span className="absolute -top-1.5 -right-1.5 bg-[#c9a96e] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartBadge}
              </span>
            </Link>
            <Link
              href="/login"
              className="ml-auto px-5 py-2 border border-[#c9a96e]/60 text-[#c9a96e] text-[10px] tracking-[0.2em] uppercase hover:bg-[#c9a96e] hover:text-black transition-all duration-300"
              style={{ fontFamily: SERIF }}
            >
              MI CUENTA
            </Link>
          </div>
        </div>
      </div>
    </nav>

    {/* Floating mobile cart button — bottom-right, visible only on small screens */}
    {mounted && (
      <Link
        href="/cart"
        aria-label="Carrito"
        className="fixed bottom-6 right-6 z-50 md:hidden flex items-center justify-center w-14 h-14 rounded-full bg-[#c9a96e] shadow-[0_4px_20px_rgba(0,0,0,0.4)] active:scale-95 transition-transform duration-150"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-black"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
          />
        </svg>
        {cartBadge > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-[#c9a96e] text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center">
            {cartBadge}
          </span>
        )}
      </Link>
    )}
    </>
  );
}
