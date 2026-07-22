"use client";

import { useOrderPaymentStatus, type OrderPaymentStatus } from "@/hooks/useOrderPaymentStatus";
import CancelledBanner from "./CancelledBanner";

interface OrderStatusSectionProps {
  orderId: string;
  orderNumber: number;
  token: string | undefined;
  /** Set when Onvo redirected here via cancelUrl (?cancelled=1). */
  isCancelled: boolean;
  /** Server-rendered status seed — keeps the first paint instant + flicker-free. */
  initial: OrderPaymentStatus;
}

/**
 * Status-dependent chrome for the order page: the cancelled banner (if any) and
 * the header (icon + title + badge). Lives on the client so it can poll for
 * webhook-driven payment confirmation and update itself — the customer never
 * has to refresh.
 *
 * The static parts of the page (products, delivery, totals) stay server-
 * rendered; only this island re-renders as the status changes.
 */
export default function OrderStatusSection({
  orderId,
  orderNumber,
  token,
  isCancelled,
  initial,
}: OrderStatusSectionProps) {
  const { status, isConfirming, isPaid, isFailed } = useOrderPaymentStatus({
    orderId,
    token,
    initial,
  });

  return (
    <>
      {isCancelled && !isPaid && (
        <CancelledBanner orderId={orderId} token={token} />
      )}

      <header className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${
            isPaid
              ? "bg-emerald-100"
              : isFailed
              ? "bg-red-100"
              : isCancelled
              ? "bg-amber-100"
              : "bg-gray-100"
          }`}
        >
          {isPaid ? (
            <CheckIcon className="w-7 h-7 text-emerald-700" />
          ) : isConfirming ? (
            <Spinner className="w-6 h-6 text-gray-500" />
          ) : (
            <ClockIcon
              className={`w-7 h-7 ${
                isFailed
                  ? "text-red-700"
                  : isCancelled
                  ? "text-amber-700"
                  : "text-gray-600"
              }`}
            />
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          {isPaid
            ? "¡Gracias por tu pedido!"
            : isFailed
            ? "Pago no completado"
            : isConfirming
            ? "Confirmando tu pago…"
            : isCancelled
            ? "Pago no completado"
            : "Tu pedido fue recibido"}
        </h1>

        {/* While the webhook is confirming, replace the bare "pending" badge
            with a reassuring message so the customer knows the payment landed. */}
        {isConfirming ? (
          <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
            Tu pago fue recibido y está siendo verificado. Esto usualmente toma
            solo unos segundos.
          </p>
        ) : (
          <p className="text-sm text-gray-600 mt-2">
            Pedido <span className="font-mono">#{orderNumber}</span> ·{" "}
            <StatusBadge
              orderStatus={status.order_status}
              paymentStatus={status.payment_status}
            />
          </p>
        )}
      </header>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Presentational helpers
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({
  orderStatus,
  paymentStatus,
}: {
  orderStatus: string;
  paymentStatus: string;
}) {
  let label = "Pago pendiente";
  let cls = "bg-amber-100 text-amber-800";

  if (orderStatus === "denied") {
    label = paymentStatus === "failed" ? "Pago fallido" : "Cancelado";
    cls = "bg-red-100 text-red-800";
  } else if (orderStatus === "shipped") {
    label = "Enviado";
    cls = "bg-blue-100 text-blue-800";
  } else if (orderStatus === "received" && paymentStatus === "paid") {
    label = "Confirmado";
    cls = "bg-emerald-100 text-emerald-800";
  } else if (paymentStatus === "paid") {
    label = "Pagado";
    cls = "bg-emerald-100 text-emerald-800";
  }

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
