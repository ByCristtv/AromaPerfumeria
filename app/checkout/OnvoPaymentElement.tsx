"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import type { OnvoPayInstance } from "@/types/onvo-sdk";

const ONVO_SDK_SRC = "https://sdk.onvopay.com/sdk.js";
const CONTAINER_ID = "onvo-payment-container";

interface OnvoPaymentElementProps {
  publicKey: string;
  paymentIntentId: string;
  customerId: string;
  /** Called when Onvo confirms the payment succeeded (client-side signal). */
  onSuccess: () => void;
}

type Status = "loading" | "ready" | "submitting" | "error";

/**
 * Renders the ONVO embedded Web SDK inline (no redirect, no modal). The SDK
 * owns all card fields — we never see card data — and we drive the charge with
 * our own button via `manualSubmit: true` + `submitPayment()`.
 *
 * Lifecycle:
 *   1. Load sdk.onvopay.com/sdk.js (next/script, afterInteractive).
 *   2. Once loaded, call `onvo.pay(...)` ONCE and `render()` into our container.
 *   3. "Completar compra" → `submitPayment()`. Onvo then calls onSuccess/onError.
 *
 * The webhook is the source of truth for payment state; onSuccess here just
 * advances the UI to the confirmation page.
 */
export default function OnvoPaymentElement({
  publicKey,
  paymentIntentId,
  customerId,
  onSuccess,
}: OnvoPaymentElementProps) {
  // Lazy init from the window global: if a previous mount (e.g. the user went
  // back to edit, then returned to payment) already loaded the SDK script, we
  // start "loaded" without waiting for another onLoad. This subtree only ever
  // renders client-side after a user interaction, so there's no SSR/hydration
  // mismatch to worry about.
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(
    () => typeof window !== "undefined" && !!window.onvo
  );
  const [status, setStatus] = useState<Status>("loading");
  const instanceRef = useRef<OnvoPayInstance | null>(null);
  // Guards against re-running pay()/render() on every re-render.
  const initializedRef = useRef(false);

  // Keep the latest onSuccess without re-initializing the SDK when it changes.
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const showPaymentError = useCallback((text: string) => {
    void Swal.fire({
      icon: "error",
      title: "No se pudo procesar el pago",
      text,
    });
  }, []);

  // Initialize the SDK exactly once, when the script is ready. This is genuine
  // external-system synchronization: we imperatively mount a third-party widget
  // and reflect its load/init outcome in `status`. The set-state-in-effect calls
  // below are inherent to that and guarded to run a single time (initializedRef),
  // so they can't cascade — disabling the lint rule here is intentional.
  useEffect(() => {
    if (!scriptLoaded || initializedRef.current) return;

    const sdk = window.onvo;
    if (!sdk) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      return;
    }

    try {
      const instance = sdk.pay({
        publicKey,
        paymentIntentId,
        customerId,
        paymentType: "one_time",
        manualSubmit: true,
        locale: "es",
        onSuccess: () => {
          console.log("ONVO SDK SUCCESS");
          setStatus("ready");
          onSuccessRef.current();
        },
        onError: () => {
          setStatus("ready");
          showPaymentError(
            "Revisa los datos de tu tarjeta e intenta de nuevo. Si el problema persiste, contáctanos por WhatsApp."
          );
        },
      });
      instance.render(`#${CONTAINER_ID}`);
      instanceRef.current = instance;
      initializedRef.current = true;
      setStatus("ready");
    } catch (err) {
      console.error("[onvo] SDK initialization failed", err);
      setStatus("error");
    }
  }, [scriptLoaded, publicKey, paymentIntentId, customerId, showPaymentError]);

  const handleSubmit = useCallback(() => {
    const instance = instanceRef.current;
    if (!instance || status === "submitting") return;

    setStatus("submitting");
    try {
      instance.submitPayment();
    } catch (err) {
      console.error("[onvo] submitPayment failed", err);
      setStatus("ready");
      showPaymentError(
        "No pudimos iniciar el cobro. Intenta de nuevo en unos momentos."
      );
    }
  }, [status, showPaymentError]);

  return (
    <div className="space-y-4">
      <Script
        src={ONVO_SDK_SRC}
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setStatus("error")}
      />

      {status === "error" ? (
        <div className="rounded-none border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          <p className="font-medium mb-1">No pudimos cargar el pago</p>
          <p className="leading-relaxed">
            Hubo un problema al iniciar el formulario de pago. Recarga la página
            e intenta de nuevo, o contáctanos por WhatsApp si continúa.
          </p>
        </div>
      ) : (
        <>
          {/* SDK mounts every card field inside this container. */}
          <div
            id={CONTAINER_ID}
            className="min-h-[220px] rounded-none border border-krov-smoke bg-krov-coal p-3 sm:p-4"
          />

          {status === "loading" && (
            <p className="text-xs text-krov-dust text-center">
              Cargando pago seguro…
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={status !== "ready"}
            className="w-full rounded-none bg-krov-blood text-krov-void py-3 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "submitting" ? "Procesando…" : "Completar compra"}
          </button>
        </>
      )}
    </div>
  );
}
