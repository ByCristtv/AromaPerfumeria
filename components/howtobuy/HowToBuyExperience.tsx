"use client";

import React from "react";
import {
  ClipboardList,
  LayoutGrid,
  ListFilter,
  LogIn,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  SprayCan,
  UserRound,
  Wallet,
} from "lucide-react";
import HowToBuyHero from "./HowToBuyHero";
import SectionHeading from "./SectionHeading";
import StepCard, { type Step } from "./StepCard";
import StepConnector from "./StepConnector";
import SuccessCard from "./SuccessCard";

const optionalSteps: Step[] = [
  {
    number: 1,
    title: "Inicia sesión en tu cuenta",
    description:
      'Para una experiencia más rápida y personalizada, haz clic en "Mi Cuenta", ubicado en la esquina superior derecha del sitio.',
    icon: UserRound,
    imageSrc: "/images/howtobuy/1.png",
    imageAlt: 'Botón "Mi Cuenta" resaltado en la barra superior.',

  },
  {
    number: 2,
    title: "Continúa con Google",
    description:
      'Selecciona "Continuar con Google" y elige la cuenta que deseas usar. Iniciar sesión te permite dar seguimiento a tus pedidos y disfrutar de un checkout más fluido.',
    icon: LogIn,
    imageSrc: "/images/howtobuy/2.png",
    imageAlt: "Pantalla de inicio de sesión con Google.",
  },
];

const mainSteps: Step[] = [
  {
    number: 3,
    title: "Explora el catálogo",
    description:
      'Desde la página principal, haz clic en "Ver Catálogo" para descubrir nuestra colección completa de fragancias.',
    icon: LayoutGrid,
    imageSrc: "/images/howtobuy/3.png",
    imageAlt: 'Página de inicio con el botón "Ver Catálogo" resaltado.',
  },
  {
    number: 4,
    title: "Encuentra tu fragancia ideal",
    description:
      "Usa la barra de búsqueda para localizar un perfume al instante, o afina tu búsqueda con filtros por categoría, tipo de producto y orden por precio o nombre.",
    icon: ListFilter,
    imageSrc: "/images/howtobuy/4.png",
    imageAlt: "Página de catálogo mostrando búsqueda y filtros.",
  },
  {
    number: 5,
    title: "Elige tu presentación",
    description:
      "Al encontrar una fragancia, puedes agregarla directamente al carrito o abrir su página para ver información detallada y elegir el formato que mejor se ajuste a ti: frascos completos, decants u otros tamaños disponibles.",
    icon: SprayCan,
    imageSrc: "/images/howtobuy/5.png",
    imageAlt: "Página de producto mostrando variantes y tamaños.",
  },
  {
    number: 6,
    title: "Abre tu carrito",
    description:
      "Cuando estés listo, haz clic en el ícono del carrito ubicado en la esquina superior derecha de la página.",
    icon: ShoppingCart,
    imageSrc: "/images/howtobuy/6.png",
    imageAlt: "Ícono del carrito de compras resaltado.",
  },
  {
    number: 7,
    title: "Revisa y gestiona tu pedido",
    description:
      "Ajusta cantidades, revisa los productos seleccionados o elimina artículos antes de continuar al pago.",
    icon: ClipboardList,
    imageSrc: "/images/howtobuy/7.png",
    imageAlt: "Página del carrito con productos y controles de cantidad.",
  },
  {
    number: 8,
    title: "Procede al pago",
    description:
      'Haz clic en el botón "Pagar" ubicado en el resumen de tu orden.',
    icon: ShoppingBag,
    imageSrc: "/images/howtobuy/8.png",
    imageAlt: 'Botón de "Pagar" resaltado en el resumen del pedido.',
  },
  {
    number: 9,
    title: "Ingresa tus datos de envío",
    description:
      "Completa el formulario con tu información personal y dirección de entrega para asegurar que tu pedido llegue a ti de forma segura.",
    icon: MapPin,
    imageSrc: "/images/howtobuy/9.png",
    imageAlt: "Formulario de checkout con los datos de envío.",
  },
  {
    number: 10,
    title: "Completa tu pago de forma segura",
    description:
      "En la página de pago de ONVO, ingresa los datos de tu tarjeta o selecciona SINPE Móvil como método de pago preferido.",
    note: "Si pagas por SINPE Móvil, envía tu comprobante al número que aparece en pantalla para que nuestro equipo pueda verificar tu pago.",
    icon: Wallet,
    imageSrc: "/images/howtobuy/10.png",
    imageAlt: "Página de pago de ONVO con la opción de SINPE Móvil.",
  },
];

function StepList({ steps }: { steps: Step[] }) {
  return (
    <div className="mt-16 flex flex-col">
      {steps.map((step, i) => (
        <React.Fragment key={step.number}>
          <StepCard step={step} index={i} />
          {i < steps.length - 1 && <StepConnector />}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Full premium onboarding journey for "Cómo Comprar". */
export default function HowToBuyExperience() {
  return (
    <main className="relative bg-[#0a0a0a]">
      {/* Subtle vertical texture behind the whole journey */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0c0b0a] via-[#0a0a0a] to-[#080808]"
      />

      <div className="relative">
        <HowToBuyHero />

        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          {/* Optional but recommended */}
          <section
            aria-labelledby="optional-heading"
            className="pt-12 md:pt-20"
          >
            <div id="optional-heading">
              <SectionHeading
                eyebrow="Opcional pero recomendado"
                title="Comienza con"
                emphasis="ventaja"
                description="Estos pasos no son obligatorios, pero hacen tu experiencia más rápida, segura y personalizada."
              />
            </div>
            <StepList steps={optionalSteps} />
          </section>

          {/* Elegant divider */}
          <div
            aria-hidden="true"
            className="mx-auto my-20 flex max-w-xs items-center gap-4 md:my-28"
          >
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c9a96e]/30" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#c9a96e]/60" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c9a96e]/30" />
          </div>

          {/* Start shopping */}
          <section aria-labelledby="shopping-heading">
            <div id="shopping-heading">
              <SectionHeading
                eyebrow="Comienza a comprar"
                title="El recorrido hacia tu"
                emphasis="fragancia"
                description="Sigue estos pasos para descubrir, elegir y recibir tu perfume con total tranquilidad."
              />
            </div>
            <StepList steps={mainSteps} />
          </section>

          {/* Success */}
          <div className="py-24 md:py-32">
            <SuccessCard />
          </div>
        </div>
      </div>
    </main>
  );
}
