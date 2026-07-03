"use client";

import ContactHero from "./ContactHero";
import ContactMethods from "./ContactMethods";
import ContactForm from "./ContactForm";
import FAQAccordion from "./FAQAccordion";
import CTASection from "./CTASection";

/** Full premium "Contacto" experience. */
export default function ContactExperience() {
  return (
    <main className="relative bg-[#0a0a0a]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0b0a] via-[#0a0a0a] to-[#080808]"
      />

      <div className="relative">
        <ContactHero />

        <div className="mx-auto max-w-6xl space-y-24 px-5 pb-28 sm:px-8 md:space-y-32 md:pb-36">
          <ContactMethods />
          <ContactForm />
          <FAQAccordion />
          <CTASection />
        </div>
      </div>
    </main>
  );
}
