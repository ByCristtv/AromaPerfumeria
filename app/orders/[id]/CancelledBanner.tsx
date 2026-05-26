"use client";

import { useState } from "react";
import Swal from "sweetalert2";

interface CancelledBannerProps {
  orderId: string;
  /** The HMAC token from the URL. Forwarded to the retry endpoint so guest
   *  callers can authorize. Server still validates. */
  token: string | undefined;
}

/**
 * Shown on /orders/[id] when the URL has ?cancelled=1 — i.e. Onvo redirected
 * the customer back via cancelUrl (they closed/cancelled at the payment page).
 *
 * Offers a "Reintentar pago" button that asks the server to mint a fresh
 * Onvo checkout session for the same order, then redirects there.
 *
 * If the retry is rejected (order too old, already denied, etc.), shows the
 * server's user-friendly message via sweetalert.
 */
export default function CancelledBanner({ orderId, token }: CancelledBannerProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleRetry() {
    setIsLoading(true);
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/checkout/retry/${orderId}${qs}`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        await Swal.fire({
          icon: "warning",
          title: "No pudimos reintentar",
          text:
            body.message ??
            "Ocurrió un problema. Por favor intenta de nuevo o contáctanos por WhatsApp.",
        });
        return;
      }

      const data = (await res.json()) as { payment_url?: string };
      if (!data.payment_url) {
        await Swal.fire({
          icon: "error",
          title: "Respuesta inválida",
          text: "El servidor no devolvió un enlace de pago. Contáctanos por WhatsApp.",
        });
        return;
      }

      // Redirect to the fresh Onvo checkout session.
      window.location.assign(data.payment_url);
    } catch (err) {
      console.error("[CancelledBanner] retry failed", err);
      await Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: "No pudimos contactar al servidor. Revisa tu conexión e intenta de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-sm text-amber-900">
      <p className="font-medium mb-1">No completaste el pago</p>
      <p className="leading-relaxed mb-4">
        Tu pedido fue creado pero el pago aún no se procesó. Puedes
        reintentarlo abajo, o escribirnos por WhatsApp si prefieres ayuda.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isLoading}
          className="rounded-lg bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Generando enlace…" : "Reintentar pago"}
        </button>
      </div>
    </div>
  );
}
