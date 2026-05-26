import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { verifyOrderToken } from "@/lib/orders/tokens";
import { formatPrice } from "@/lib/format";
import CancelledBanner from "./CancelledBanner";

export const metadata: Metadata = {
  title: "Tu pedido — Aroma Perfumería",
  description: "Detalles de tu pedido.",
};

interface OrderPageProps {
  // Next.js 16: params + searchParams are both async and MUST be awaited.
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; cancelled?: string }>;
}

/**
 * Order confirmation / detail page.
 *
 * AUTH MODEL (Phase 5):
 *   1. Try the cookies-aware client first. If RLS permits the fetch, the user
 *      is the order owner or an admin → allow.
 *   2. Otherwise verify the URL's ?token=... against an HMAC of the order_id.
 *      Valid token → allow (guest path, used right after checkout).
 *   3. Neither matches → 404.
 *
 * In either allow case, the actual data fetch goes through the admin client
 * to bypass RLS uniformly. We've already proved authorization.
 *
 * The ?cancelled=1 query param (set by Onvo's cancelUrl) renders a banner
 * above the order details inviting the customer to retry via WhatsApp.
 */
export default async function OrderPage({
  params,
  searchParams,
}: OrderPageProps) {
  const { id } = await params;
  const { token, cancelled } = await searchParams;

  // Quick UUID format check before any DB call.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  // ──────── 1. Try the RLS-gated path ────────
  // If the user is logged in AND owns the order (or is admin), this read
  // succeeds. If they don't own it OR aren't logged in, RLS returns null —
  // we'll fall through to token verification.
  const userClient = await createClient();
  const { data: ownedOrder } = await userClient
    .from("orders")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  let authorized = ownedOrder !== null;

  // ──────── 2. Token fallback for guests ────────
  if (!authorized && verifyOrderToken(id, token)) {
    authorized = true;
  }

  if (!authorized) {
    notFound();
  }

  // ──────── 3. Fetch the full order via admin (bypasses RLS) ────────
  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select(
      `
      id,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_canton,
      shipping_district,
      shipping_province,
      shipping_reference,
      subtotal,
      shipping_cost,
      total,
      order_status,
      payment_status,
      notes,
      created_at,
      order_items (
        id,
        product_name,
        brand_name,
        size_ml,
        sku,
        quantity,
        unit_price,
        line_total
      )
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (orderErr) {
    console.error("[orders/[id]] failed to fetch order", { id, orderErr });
    throw new Error("No pudimos cargar tu pedido.");
  }
  if (!order) {
    // Authorized but missing — race condition (order deleted) or a token
    // signed for an id that was later wiped. 404 is the right answer.
    notFound();
  }

  const isCancelled = cancelled === "1";

  return (
    <section className="pt-28 pb-16 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto">
        {/* ──────── Cancelled banner (only if Onvo redirected here from cancel) ──────── */}
        {isCancelled && order.payment_status !== "paid" && (
          <CancelledBanner orderId={order.id} token={token} />
        )}

        {/* ──────── Header ──────── */}
        <header className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 ${
              order.payment_status === "paid"
                ? "bg-emerald-100"
                : isCancelled
                ? "bg-amber-100"
                : "bg-gray-100"
            }`}
          >
            {order.payment_status === "paid" ? (
              <CheckIcon className="w-7 h-7 text-emerald-700" />
            ) : (
              <ClockIcon
                className={`w-7 h-7 ${
                  isCancelled ? "text-amber-700" : "text-gray-600"
                }`}
              />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {order.payment_status === "paid"
              ? "¡Gracias por tu pedido!"
              : isCancelled
              ? "Pago no completado"
              : "Tu pedido fue recibido"}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Pedido <span className="font-mono">#{order.order_number}</span> ·{" "}
            <StatusBadge
              orderStatus={order.order_status}
              paymentStatus={order.payment_status}
            />
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">
          {/* ──────── Items + delivery ──────── */}
          <div className="space-y-5">
            <Panel title="Productos">
              <ul className="divide-y divide-gray-100">
                {(order.order_items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {item.brand_name} — {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.size_ml} ml · cant. {item.quantity} ·{" "}
                        <span className="font-mono">{item.sku}</span>
                      </p>
                    </div>
                    <span className="text-sm text-gray-900 shrink-0 tabular-nums">
                      {formatPrice(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Entrega">
              <dl className="text-sm text-gray-700 space-y-1">
                <Row label="Nombre" value={order.customer_name} />
                <Row label="Teléfono" value={order.customer_phone} />
                <Row label="Correo" value={order.customer_email ?? "—"} />
                <Row
                  label="Provincia / Cantón"
                  value={`${order.shipping_province} / ${order.shipping_canton}`}
                />
                {order.shipping_district && (
                  <Row label="Distrito" value={order.shipping_district} />
                )}
                <Row label="Señas" value={order.shipping_address} />
                {order.shipping_reference && (
                  <Row label="Referencia" value={order.shipping_reference} />
                )}
                {order.notes && <Row label="Notas" value={order.notes} />}
              </dl>
            </Panel>

            {order.payment_status === "paid" && (
              <p className="text-sm text-gray-500 leading-relaxed">
                Te enviaremos un correo a{" "}
                <strong>{order.customer_email}</strong> con los detalles y
                actualizaciones de tu pedido. Si tienes preguntas, contáctanos
                por WhatsApp.
              </p>
            )}
          </div>

          {/* ──────── Totals ──────── */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-5 h-fit md:sticky md:top-28">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Total
            </h2>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between text-gray-600">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-gray-600">
                <dt>Envío</dt>
                <dd className="tabular-nums">
                  {order.shipping_cost > 0
                    ? formatPrice(order.shipping_cost)
                    : "Gratis"}
                </dd>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 pt-3 border-t border-gray-200">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <Link
              href="/"
              className="mt-5 block text-center text-sm font-medium text-black underline"
            >
              Seguir comprando
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline UI helpers
// ─────────────────────────────────────────────────────────────────────────────

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <dt className="text-gray-500 sm:w-32 shrink-0">{label}</dt>
      <dd className="text-gray-900 break-words">{value}</dd>
    </div>
  );
}

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
