import type { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Checkout",
  description: "Confirma tus datos de envío y finaliza tu compra.",
};

/**
 * Checkout page (server component shell).
 *
 * All state lives in <CheckoutClient /> — this server component just renders
 * the chrome (title, container) and the client orchestrator. We deliberately
 * don't pre-fetch saved addresses here for v1: until we have an authenticated
 * test user, prefill adds complexity without testable benefit.
 *
 * Future (when auth-prefill is wanted):
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   const addresses = user ? await fetchAddresses(supabase, user.id) : [];
 *   <CheckoutClient initialAddresses={addresses} initialUser={user} />
 */
export default function CheckoutPage() {
  return (
    <section className="pt-28 pb-16 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Finalizar compra
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Confirma tus datos y elige tu método de envío.
          </p>
        </header>

        <CheckoutClient />
      </div>
    </section>
  );
}
