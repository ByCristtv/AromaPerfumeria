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
import type { LucideIcon } from "lucide-react";

/** Which device journey the reader is following. */
export type FlowView = "desktop" | "mobile";

/**
 * Step copy — the SINGLE source of truth, shared by both flows.
 *
 * Desktop and mobile differ only in screenshots, never in wording, so the text
 * lives here exactly once. Editing a description updates both journeys and they
 * cannot drift apart.
 */
export interface StepContent {
  number: number;
  title: string;
  description: string;
  /** Optional secondary call-out (e.g. the SINPE proof-of-payment note). */
  note?: string;
  icon: LucideIcon;
  imageAlt: string;
}

/** A step resolved for one view: shared copy + that view's screenshot (if any). */
export interface ResolvedStep extends StepContent {
  /** `undefined` renders the placeholder skeleton — the mobile flow's default. */
  imageSrc?: string;
}

export const OPTIONAL_STEPS: StepContent[] = [
  {
    number: 1,
    title: "Inicia sesión en tu cuenta",
    description:
      'Para una experiencia más rápida y personalizada, entra a "Iniciar sesión" desde el menú superior del sitio.',
    icon: UserRound,
    imageAlt: "Acceso a la cuenta desde la barra superior.",
  },
  {
    number: 2,
    title: "Continúa con Google",
    description:
      'Selecciona "Continuar con Google" y elige la cuenta que deseas usar. Iniciar sesión te permite dar seguimiento a tus pedidos y disfrutar de un checkout más fluido.',
    icon: LogIn,
    imageAlt: "Pantalla de inicio de sesión con Google.",
  },
];

export const MAIN_STEPS: StepContent[] = [
  {
    number: 3,
    title: "Explora el catálogo",
    description:
      'Desde la página principal, haz clic en "Ver Catálogo" para descubrir nuestra colección completa de fragancias.',
    icon: LayoutGrid,
    imageAlt: 'Página de inicio con el botón "Ver Catálogo" resaltado.',
  },
  {
    number: 4,
    title: "Encuentra tu fragancia ideal",
    description:
      "Usa la barra de búsqueda para localizar un perfume al instante, o afina tu búsqueda con filtros por categoría, tipo de producto y orden por precio o nombre.",
    icon: ListFilter,
    imageAlt: "Página de catálogo mostrando búsqueda y filtros.",
  },
  {
    number: 5,
    title: "Elige tu presentación",
    description:
      "Al encontrar una fragancia, puedes agregarla directamente al carrito o abrir su página para ver información detallada y elegir el formato que mejor se ajuste a ti: frascos completos, decants u otros tamaños disponibles.",
    icon: SprayCan,
    imageAlt: "Página de producto mostrando variantes y tamaños.",
  },
  {
    number: 6,
    title: "Abre tu carrito",
    description:
      "Cuando estés listo, abre tu carrito para revisar todo lo que has seleccionado.",
    icon: ShoppingCart,
    imageAlt: "Ícono del carrito de compras resaltado.",
  },
  {
    number: 7,
    title: "Revisa y gestiona tu pedido",
    description:
      "Ajusta cantidades, revisa los productos seleccionados o elimina artículos antes de continuar al pago.",
    icon: ClipboardList,
    imageAlt: "Página del carrito con productos y controles de cantidad.",
  },
  {
    number: 8,
    title: "Procede al pago",
    description:
      'Haz clic en el botón "Pagar" ubicado en el resumen de tu orden.',
    icon: ShoppingBag,
    imageAlt: 'Botón de "Pagar" resaltado en el resumen del pedido.',
  },
  {
    number: 9,
    title: "Ingresa tus datos de envío",
    description:
      "Completa el formulario con tu información personal y dirección de entrega para asegurar que tu pedido llegue a ti de forma segura.",
    icon: MapPin,
    imageAlt: "Formulario de checkout con los datos de envío.",
  },
  {
    number: 10,
    title: "Elige cómo pagar y confirma",
    description:
      "Selecciona tu método de pago: tarjeta (procesado de forma segura por ONVO) o SINPE Móvil. Luego confirma tu compra.",
    note: "Si pagas por SINPE Móvil, te mostraremos el número y el monto exacto. Envía el comprobante por WhatsApp y nuestro equipo verifica tu pago manualmente.",
    icon: Wallet,
    imageAlt: "Selección de método de pago en el checkout.",
  },
];

/**
 * Screenshots per view, keyed by step number.
 *
 * Mobile is intentionally EMPTY: every mobile step renders the placeholder
 * skeleton until real captures are dropped in. Adding one is a single line here
 * — no component or layout changes.
 */
const SCREENSHOTS: Record<FlowView, Record<number, string>> = {
  desktop: {
    1: "/images/howtobuy/1pc.avif",
    2: "/images/howtobuy/2pc.avif",
    3: "/images/howtobuy/3pc.avif",
    4: "/images/howtobuy/4pc.avif",
    5: "/images/howtobuy/5pc.avif",
    6: "/images/howtobuy/6pc.avif",
    7: "/images/howtobuy/7pc.avif",
    8: "/images/howtobuy/8pc.avif",
    9: "/images/howtobuy/9pc.avif",
    10: "/images/howtobuy/10pc.avif",
  },
  // e.g. 3: "/images/howtobuy/mobile/3.png"
  mobile: {
    1: "/images/howtobuy/mobile/step2mobile.avif",
    2: "/images/howtobuy/mobile/step3mobile.avif",
    3: "/images/howtobuy/mobile/step4mobile.avif",
    4: "/images/howtobuy/mobile/step5mobile.avif",
    5: "/images/howtobuy/mobile/step6mobile.avif",
    6: "/images/howtobuy/mobile/step7mobile.avif",
    7: "/images/howtobuy/mobile/step8mobile.avif",
    8: "/images/howtobuy/mobile/step9mobile.avif",
    9: "/images/howtobuy/mobile/step9v2mobile.avif",
    10: "/images/howtobuy/mobile/step10mobile.avif",
  },
};

/** Merge shared copy with the active view's screenshots. */
export function resolveSteps(
  steps: StepContent[],
  view: FlowView
): ResolvedStep[] {
  const images = SCREENSHOTS[view];
  return steps.map((step) => ({ ...step, imageSrc: images[step.number] }));
}
