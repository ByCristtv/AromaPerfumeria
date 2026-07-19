/**
 * Transport-agnostic checkout failure.
 *
 * Services throw these; the route handler catches and maps them to HTTP. This is
 * what keeps the route a thin adapter and the services free of NextResponse —
 * the same services could be driven from a Server Action or a script.
 *
 * `message` is user-facing Spanish and is rendered verbatim by the client, so it
 * must never carry internals. Put diagnostics in `hint` (dev-only surfaced) or a
 * console.error at the throw site.
 */
export class CheckoutError extends Error {
  constructor(
    /** Machine-readable code the client branches on, e.g. 'stock_unavailable'. */
    readonly code: string,
    /** Safe-to-display Spanish message. */
    message: string,
    /** HTTP status the route should return. */
    readonly status: number,
    /** Extra diagnostic context. Only surfaced to the client in development. */
    readonly hint?: string
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

/**
 * The order backing this checkout is already paid. The client must clear its
 * stored session and send the customer to their order page — re-placing would
 * charge them twice.
 */
export function alreadyPaidError(): CheckoutError {
  return new CheckoutError(
    "already_paid",
    "Este pedido ya fue pagado. Revisa tu correo para los detalles.",
    409
  );
}

/**
 * The session ref didn't verify, or its order vanished. Deliberately 404 rather
 * than 403 so we don't confirm the existence of someone else's order id.
 * The client clears its session and retries once as a fresh checkout.
 */
export function sessionNotFoundError(): CheckoutError {
  return new CheckoutError(
    "not_found",
    "No encontramos tu pedido. Vamos a empezar de nuevo.",
    404
  );
}

/** The payment provider is unreachable or rejected the request. */
export function paymentProviderError(hint?: string): CheckoutError {
  return new CheckoutError(
    "payment_provider_error",
    "No pudimos conectar con el proveedor de pago. Por favor intenta de nuevo en unos momentos.",
    502,
    hint
  );
}

/** Catch-all for our own bugs / infrastructure failures. */
export function internalError(hint?: string): CheckoutError {
  return new CheckoutError(
    "internal_error",
    "No pudimos procesar tu pedido. Por favor intenta de nuevo.",
    500,
    hint
  );
}
