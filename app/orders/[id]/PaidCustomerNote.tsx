"use client";

import { useOrderPaymentStatus, type OrderPaymentStatus } from "@/hooks/useOrderPaymentStatus";

interface PaidCustomerNoteProps {
  orderId: string;
  token: string | undefined;
  customerEmail: string | null;
  initial: OrderPaymentStatus;
}

/**
 * The "we'll email you the details" note, shown only once the payment is
 * confirmed. Subscribes to the same query key as OrderStatusSection, so it
 * flips into view the instant the webhook confirms — no extra polling loop
 * (TanStack Query dedupes by key) and no page refresh.
 */
export default function PaidCustomerNote({
  orderId,
  token,
  customerEmail,
  initial,
}: PaidCustomerNoteProps) {
  const { isPaid } = useOrderPaymentStatus({ orderId, token, initial });

  if (!isPaid) return null;

  return (
    <p className="text-sm text-krov-dust leading-relaxed">
      Te enviaremos un correo a <strong>{customerEmail}</strong> con los detalles
      y actualizaciones de tu pedido. Si tienes preguntas, contáctanos por
      WhatsApp.
    </p>
  );
}
