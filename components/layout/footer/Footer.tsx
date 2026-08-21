import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import FooterBottomBar from "./FooterBottomBar";
import KrovLogo from "@/components/brand/KrovLogo";
import {
  BRAND_STATEMENT,
  FOOTER_CONTACT,
  FOOTER_SOCIALS,
  INFO_LINKS,
  SHOP_LINKS,
  TRUST_INDICATORS,
} from "./footerData";

const serif = "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-6 text-[10px] uppercase tracking-[0.3em] text-krov-rose">
      {children}
    </h3>
  );
}

function FooterNav({ links }: { links: { label: string; href: string }[] }) {
  // `inline-block py-1` is not decorative: the bare 20px line box fell under the
  // 24px minimum target size, and a column of links is not covered by the
  // inline-text exception. Four extra pixels of padding is the whole fix.
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="krov-underline inline-block py-1 text-sm text-krov-ash transition-colors duration-300 hover:text-krov-bone"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The closing statement.
 *
 * A footer is the last thing a visitor reads, so this one opens with the line
 * that explains the name rather than with a directory. The Cyrillic sits in the
 * brand statement, quietly, exactly as it does in the hero — repeated once, not
 * decorated.
 */
export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-krov-void text-krov-bone">
      {/* A single wine bloom anchoring the foot of every page — the same light
          the hero opens with, closing the document. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] krov-aura-wine opacity-50"
      />

      <div className="relative border-t border-krov-smoke">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:px-10">
          {/* Column 1 — Brand */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label="KROV Perfumería — inicio"
              className="inline-block opacity-90 transition-opacity duration-300 hover:opacity-100"
            >
              <KrovLogo tone="light" width={168} />
            </Link>

            <p className="mt-7 max-w-sm text-sm leading-relaxed text-krov-ash">
              {BRAND_STATEMENT}
            </p>

            <div className="mt-8 flex items-center gap-2.5">
              {FOOTER_SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="flex h-11 w-11 items-center justify-center border border-krov-smoke transition-colors duration-300 hover:border-krov-blood hover:bg-krov-blood/10"
                >
                  <Image
                    src={social.icon}
                    alt=""
                    width={17}
                    height={17}
                    aria-hidden
                    className="opacity-70"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Tienda */}
          <div className="lg:col-span-2">
            <ColumnHeading>Tienda</ColumnHeading>
            <FooterNav links={SHOP_LINKS} />
          </div>

          {/* Column 3 — Información */}
          <div className="lg:col-span-3">
            <ColumnHeading>Información</ColumnHeading>
            <FooterNav links={INFO_LINKS} />
          </div>

          {/* Column 4 — Contacto */}
          <div className="lg:col-span-3">
            <ColumnHeading>Contacto</ColumnHeading>

            <ul className="space-y-4 text-sm text-krov-ash">
              <li>
                <a
                  href={`mailto:${FOOTER_CONTACT.email}`}
                  className="flex items-start gap-3 transition-colors duration-300 hover:text-krov-bone"
                >
                  <Mail size={15} className="mt-0.5 shrink-0 text-krov-rose" aria-hidden />
                  <span>{FOOTER_CONTACT.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={FOOTER_CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 transition-colors duration-300 hover:text-krov-bone"
                >
                  <Phone size={15} className="mt-0.5 shrink-0 text-krov-rose" aria-hidden />
                  <span>{FOOTER_CONTACT.whatsappDisplay}</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={15} className="mt-0.5 shrink-0 text-krov-rose" aria-hidden />
                <span>{FOOTER_CONTACT.hours}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="mt-0.5 shrink-0 text-krov-rose" aria-hidden />
                <span>{FOOTER_CONTACT.location}</span>
              </li>
            </ul>

            {/* Trust indicators */}
            <ul className="mt-8 space-y-2.5">
              {TRUST_INDICATORS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.14em] text-krov-dust"
                >
                  <Check
                    size={12}
                    strokeWidth={2}
                    aria-hidden
                    className="shrink-0 text-krov-rose"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The name, once, at full width — the sign over the door on the way
            out. Set in Didone at a size the wordmark itself never appears at. */}
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <p
            aria-hidden
            className="krov-rule h-px w-full"
          />
          <p
            className="select-none py-8 text-center text-[13vw] leading-none text-krov-bone/[0.04] sm:text-[9rem] lg:text-[12rem]"
            style={{ fontFamily: serif }}
            aria-hidden
          >
            KROV
          </p>
        </div>
      </div>

      {/* Section 6 — Bottom bar */}
      <FooterBottomBar />
    </footer>
  );
}
