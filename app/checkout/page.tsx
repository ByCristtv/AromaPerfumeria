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
    <section className="min-h-screen bg-krov-void px-5 pb-16 pt-28 sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Same masthead construction as the cart, one step further along, so
            the funnel reads as one continuous document rather than three
            screens that happen to link to each other. */}
        <header>
          <p className="krov-eyebrow">Último paso</p>
          <h1
            className="mt-5 text-4xl leading-none text-krov-bone sm:text-5xl"
            style={{
              fontFamily:
                "var(--font-krov-display), 'Cormorant Garamond', Georgia, serif",
            }}
          >
            Finalizar compra
          </h1>
          <p className="mt-3 text-sm text-krov-ash">
            Confirmá tus datos y elegí cómo querés recibirlo.
          </p>
          <div className="krov-rule mt-7 mb-9 h-px w-full" />
        </header>

        <CheckoutClient />
      </div>
    </section>
  );
}
