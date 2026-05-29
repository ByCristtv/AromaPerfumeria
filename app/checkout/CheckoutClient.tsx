"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import { useCart } from "@/hooks/useCart";
import { useCheckoutSubmit } from "@/hooks/useCheckoutSubmit";
import { useIsMounted } from "@/hooks/useIsMounted";
import {
  buildCheckoutPayload,
  checkoutFormDefaults,
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/schemas/checkout";
import { supabase } from "@/lib/supabase/client";
import { getAccountData } from "@/features/account/getAccountData";

/**
 * Orchestrates the /checkout page:
 *   - Owns the react-hook-form instance
 *   - Watches canton_code and feeds it to OrderSummary for live shipping preview
 *   - Handles cart-empty edge case (redirect to /cart)
 *   - Handles submit (Phase 3 placeholder; Phase 4 will replace with the real
 *     POST to /api/checkout/session that creates the order and redirects to Onvo)
 */
export default function CheckoutClient() {
  const router = useRouter();

  // SSR-safe mount guard — cart hydrates from localStorage after mount.
  const mounted = useIsMounted();
  const { cart, clearCart } = useCart();
  const submit = useCheckoutSubmit();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: checkoutFormDefaults,
    mode: "onBlur",
  });

  const watchedCantonCode = form.watch("shipping.canton_code");

  // Prefill form with logged-in user's saved data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { profile, address } = await getAccountData(user.id);
      if (cancelled) return;
      form.reset({
        customer: {
          name: user.user_metadata?.full_name ?? "",
          email: user.email ?? "",
          phone: profile?.phone ?? "",
        },
        shipping: {
          canton_code: address?.canton ?? "",
          district: address?.district ?? "",
          address: address?.exact_address ?? "",
          reference: address?.references ?? "",
        },
        notes: "",
      });
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the cart is empty after hydration (e.g., user opened /checkout in a
  // stale tab), bounce them back to /cart instead of letting them fill out
  // an order that can't be placed.
  useEffect(() => {
    if (mounted && cart.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, cart.length, router]);

  if (!mounted || cart.length === 0) {
    // Render nothing during the brief window before hydration / before the
    // redirect lands — avoids flashing an empty form.
    return null;
  }

  const handleSubmit = async (values: CheckoutFormValues) => {
    // Build the API payload (form values + derived canton/province names + cart items).
    // The builder can throw if the form's canton_code isn't in the CR-geo dataset,
    // which the form schema already prevents — but defensive try/catch anyway.
    let payload;
    try {
      payload = buildCheckoutPayload(values, cart);
    } catch (err) {
      console.error("[checkout] payload build failed", err);
      await Swal.fire({
        icon: "error",
        title: "Error preparando el pedido",
        text: "Por favor verifica los datos e intenta de nuevo.",
      });
      return;
    }

    submit.mutate(payload, {
      onSuccess: (result) => {
        // Clear the local cart store. The server-side cart_items table is
        // already cleared by place_order for authenticated users.
        clearCart();

        // Phase 5: if payment_url is set, redirect to the payment processor
        // before landing on the order confirmation page.
        if (result.payment_url) {
          window.location.assign(result.payment_url);
          return;
        }

        // No payment provider yet → straight to the confirmation page.
        router.push(`/orders/${result.order_id}`);
      },
      onError: async (error) => {
        // Distinguish stock/availability errors (user can recover by editing
        // the cart) from generic errors (just retry).
        const isStockIssue =
          error.code === "stock_unavailable" ||
          error.code === "variant_unavailable";

        await Swal.fire({
          icon: isStockIssue ? "warning" : "error",
          title: isStockIssue ? "Stock cambió" : "No pudimos procesar tu pedido",
          text: error.message,
          confirmButtonText: isStockIssue ? "Ir al carrito" : "Cerrar",
        });

        if (isStockIssue) {
          router.push("/cart");
        }
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 lg:gap-8 items-start">
      <CheckoutForm
        form={form}
        onSubmit={handleSubmit}
        isSubmitting={form.formState.isSubmitting || submit.isPending}
      />
      <OrderSummary cantonCode={watchedCantonCode || undefined} />
    </div>
  );
}
