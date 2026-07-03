import Image from "next/image";
import Link from "next/link";
import { Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import FooterBottomBar from "./FooterBottomBar";
import {
  BRAND_STATEMENT,
  FOOTER_CONTACT,
  FOOTER_SOCIALS,
  INFO_LINKS,
  SHOP_LINKS,
  TRUST_INDICATORS,
} from "./footerData";

const serif = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="mb-6 text-xs uppercase tracking-[0.3em] text-[#c9a96e]"
      style={{ fontFamily: serif }}
    >
      {children}
    </h3>
  );
}

function FooterNav({
  links,
}: {
  links: { label: string; href: string }[];
}) {
  return (
    <ul className="space-y-3.5">
      {links.map((link) => (
        <li key={link.label}>
          <Link
            href={link.href}
            className="group inline-flex items-center text-sm text-white/55 transition-colors duration-300 hover:text-white"
            style={{ fontFamily: serif }}
          >
            <span className="mr-0 h-px w-0 bg-[#c9a96e] transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-white">
      {/* Section 2 — Main footer */}
      <div className="border-t border-white/8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:px-10">
          {/* Column 1 — Brand */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex flex-col leading-none">
              <span
                className="text-3xl font-light tracking-[0.35em] text-white"
                style={{ fontFamily: serif }}
              >
                AROMA
              </span>
              <span
                className="-mt-0.5 text-[10px] italic tracking-[0.25em] text-[#c9a96e]"
                style={{ fontFamily: serif }}
              >
                Luxury Fragrance
              </span>
            </Link>

            <p
              className="mt-6 max-w-sm text-sm leading-relaxed text-white/55"
              style={{ fontFamily: serif }}
            >
              {BRAND_STATEMENT}
            </p>

            <div className="mt-7 flex items-center gap-3">
              {FOOTER_SOCIALS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9a96e]/60 hover:bg-[#c9a96e]/10"
                >
                  <Image
                    src={social.icon}
                    alt=""
                    width={18}
                    height={18}
                    aria-hidden
                    className="brightness-110"
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

            <ul className="space-y-4 text-sm text-white/55" style={{ fontFamily: serif }}>
              <li>
                <a
                  href={`mailto:${FOOTER_CONTACT.email}`}
                  className="group flex items-start gap-3 transition-colors duration-300 hover:text-white"
                >
                  <Mail size={16} className="mt-0.5 shrink-0 text-[#c9a96e]/80" aria-hidden />
                  <span>{FOOTER_CONTACT.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={FOOTER_CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-3 transition-colors duration-300 hover:text-white"
                >
                  <Phone size={16} className="mt-0.5 shrink-0 text-[#c9a96e]/80" aria-hidden />
                  <span>{FOOTER_CONTACT.whatsappDisplay}</span>
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="mt-0.5 shrink-0 text-[#c9a96e]/80" aria-hidden />
                <span>{FOOTER_CONTACT.hours}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#c9a96e]/80" aria-hidden />
                <span>{FOOTER_CONTACT.location}</span>
              </li>
            </ul>

            {/* Trust indicators */}
            <ul className="mt-7 space-y-2.5">
              {TRUST_INDICATORS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2.5 text-xs text-white/50"
                  style={{ fontFamily: serif }}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#c9a96e]/15 text-[#c9a96e]">
                    <Check size={11} strokeWidth={2.5} aria-hidden />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>    
      {/* Section 6 — Bottom bar */}
      <FooterBottomBar />
    </footer>
  );
}
