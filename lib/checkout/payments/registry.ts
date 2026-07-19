import type { PaymentMethodId, PaymentProvider } from "../types";
import { onvoCardProcessor } from "./onvoCardProcessor";
import { sinpeProcessor } from "./sinpeProcessor";
import type { PaymentProcessor } from "./types";

/**
 * The ONLY place payment methods are enumerated.
 *
 * Adding PayPal / Apple Pay / bank transfer = write a processor and add one entry
 * here. checkoutService, orderService, and the route handler all stay untouched —
 * that's the Open/Closed payoff.
 *
 * Keyed by method (what the customer picks) rather than provider (what we stamp
 * on the order), because two methods could legitimately share one provider.
 */
const PROCESSORS: Record<PaymentMethodId, PaymentProcessor> = {
  card: onvoCardProcessor,
  sinpe: sinpeProcessor,
};

/**
 * Resolve the processor for a customer-selected method.
 *
 * Total by construction — `payment_method` is a zod enum over PaymentMethodId, so
 * an unknown method is rejected at the route boundary and can't reach here.
 */
export function getPaymentProcessor(method: PaymentMethodId): PaymentProcessor {
  return PROCESSORS[method];
}

/**
 * Resolve the processor that owns an already-stamped orders.payment_provider.
 *
 * Needed when abandoning a payment we didn't just create — e.g. the customer
 * switches card → SINPE and we must release the old Onvo intent, or we cancel a
 * stale pending order. Returns null for a provider no processor claims (an order
 * placed before this refactor, or one stamped by a since-removed method); callers
 * treat that as "nothing to release", which is correct — we have no way to tear it
 * down and an orphaned intent is harmless.
 */
export function findProcessorByProvider(
  provider: PaymentProvider | null
): PaymentProcessor | null {
  if (!provider) return null;
  return (
    Object.values(PROCESSORS).find((p) => p.provider === provider) ?? null
  );
}
