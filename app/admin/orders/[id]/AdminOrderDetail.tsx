"use client";

import Link from "next/link";
import { useTransition, useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  advanceOrderStatusAction,
  denyOrderAction,
  markOrderPaidAction,
} from "../actions";
import { formatPrice } from "@/lib/format";

interface OrderItem {
  id: string;
  product_name: string;
  brand_name: string;
  size_ml: number;
  sku: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface OrderData {
  id: string;
  order_number: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_address: string;
  shipping_canton: string;
  shipping_district: string | null;
  shipping_province: string;
  shipping_reference: string | null;
  shipping_method: string | null;
  shipping_cost: number;
  subtotal: number;
  total: number;
  tax: number;
  discount: number;
  order_status: string;
  payment_status: string;
  payment_provider: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[] | null;
}

interface Props {
  order: OrderData;
}

/**
 * Admin order detail with action buttons.
 *
 * Actions are conditioned on current state:
 *   - markPaid    → only if payment_status='pending' AND order_status='pending'
 *                   (for offline SINPE/cash payments)
 *   - advance(received) → only if order_status='pending'
 *   - advance(shipped)  → only if order_status='received'
 *   - deny → any non-terminal state (not shipped, not already denied)
 *
 * Each action uses useTransition for loading state. All call the server
 * actions in ../actions.ts which handle RPC translation and revalidation.
 */
export default function AdminOrderDetail({ order }: Props) {
  const [isPending, startTransition] = useTransition();
  const [pageMounted, setPageMounted] = useState(false);

  useEffect(() => {
    // Trigger visibility after mount so transitions run on initial render
    const t = setTimeout(() => setPageMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Sequential index generator for staggered panels
  let panelIndex = 0;
  const nextIndex = () => panelIndex++;

  // ──────── Action handlers ────────

  function runMarkPaid() {
    startTransition(async () => {
      const confirm = await Swal.fire({
        title: "Verificar pago",
        html:
          '<p style="font-size:0.85rem;color:#666;margin-bottom:0.75rem">Úsalo cuando el cliente ya pagó por SINPE Móvil, transferencia o efectivo.</p>' +
          '<input id="swal-ref" class="swal2-input" placeholder="Referencia (SINPE/transferencia)">' +
          '<input id="swal-note" class="swal2-input" placeholder="Nota de pago (opcional)">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Marcar pagado",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#c9a96e",
        preConfirm: () => ({
          reference:
            (document.getElementById("swal-ref") as HTMLInputElement | null)?.value ?? "",
          note:
            (document.getElementById("swal-note") as HTMLInputElement | null)?.value ?? "",
        }),
      });
      if (!confirm.isConfirmed) return;

      const { reference, note } = confirm.value as { reference: string; note: string };
      const result = await markOrderPaidAction(order.id, reference, note);
      await Swal.fire({
        icon: result.ok ? "success" : "error",
        title: result.ok ? "Pago registrado" : "No se pudo",
        text: result.message,
      });
    });
  }

  function runAdvance(to: "received" | "shipped") {
    startTransition(async () => {
      if (to === "shipped") {
        const confirm = await Swal.fire({
          title: "¿Marcar como enviado?",
          text: "Esta acción es definitiva — no podrás revertirla desde la UI.",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, marcar enviado",
          cancelButtonText: "No",
        });
        if (!confirm.isConfirmed) return;
      }

      const result = await advanceOrderStatusAction(order.id, to);
      await Swal.fire({
        icon: result.ok ? "success" : "error",
        title: result.ok ? "Estado actualizado" : "No se pudo actualizar",
        text: result.message,
        timer: result.ok ? 1800 : undefined,
        showConfirmButton: !result.ok,
      });
    });
  }

  function runDeny() {
    startTransition(async () => {
      const prompt = await Swal.fire({
        title: "Cancelar pedido",
        text: "Esta acción restaurará el stock y marcará el pedido como cancelado. Si el cliente ya pagó, también deberás procesar el reembolso desde Onvo.",
        icon: "warning",
        input: "textarea",
        inputLabel: "Razón (obligatorio)",
        inputPlaceholder: "Ej. cliente solicitó cancelación, sin stock, etc.",
        inputValidator: (value) => {
          if (!value || !value.trim()) return "Por favor proporciona una razón";
          if (value.length > 500) return "Máximo 500 caracteres";
          return null;
        },
        showCancelButton: true,
        confirmButtonText: "Cancelar pedido",
        cancelButtonText: "No, regresar",
        confirmButtonColor: "#dc2626",
      });
      if (!prompt.isConfirmed) return;

      const reason = (prompt.value as string).trim();
      const result = await denyOrderAction(order.id, reason);
      await Swal.fire({
        icon: result.ok ? "success" : "error",
        title: result.ok ? "Pedido cancelado" : "No se pudo cancelar",
        text: result.message,
      });
    });
  }

  // ──────── Derived button visibility ────────

  const canMarkPaid =
    order.payment_status === "pending" && order.order_status === "pending";
  const canConfirm = order.order_status === "pending";
  const canShip = order.order_status === "received";
  const canDeny =
    order.order_status !== "shipped" && order.order_status !== "denied";

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-6 mt-3">
        {/* ──────── Header ──────── */}
        <header className="mb-6">
          <Link
            href="/admin/orders"
            className="text-xs text-[#a5a5a5] hover:text-[#c9a96e] uppercase tracking-wider"
          >
            ← Volver a órdenes
          </Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl font-bold text-[#ececec]">
              Pedido <span className="font-mono text-[#c9a96e]">#{order.order_number}</span>
            </h1>
            <StatusBadge status={order.order_status} />
            <PaymentBadge status={order.payment_status} />
            <span className="text-xs text-[#a5a5a5] ml-auto">
              {formatDate(order.created_at)}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* ──────── Left column: details ──────── */}
          <div className="space-y-5">
            <Panel title="Productos" index={nextIndex()} visible={pageMounted}>
              <ul className="divide-y divide-[#c9a96e]/10">
                {(order.order_items ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-[#ececec] truncate">
                        {item.brand_name} — {item.product_name}
                      </p>
                      <p className="text-xs text-[#a5a5a5]">
                        {item.size_ml} ml · cant. {item.quantity} ·{" "}
                        <span className="font-mono">{item.sku}</span> ·{" "}
                        {formatPrice(item.unit_price)} c/u
                      </p>
                    </div>
                    <span className="text-sm text-[#ececec] shrink-0 tabular-nums">
                      {formatPrice(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Cliente" index={nextIndex()} visible={pageMounted}>
              <dl className="text-sm text-[#ececec] space-y-1.5">
                <Row label="Nombre" value={order.customer_name} />
                <Row label="Teléfono" value={order.customer_phone} />
                <Row label="Correo" value={order.customer_email ?? "—"} />
              </dl>
            </Panel>

            <Panel title="Entrega" index={nextIndex()} visible={pageMounted}>
              <dl className="text-sm text-[#ececec] space-y-1.5">
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
                {order.shipping_method && (
                  <Row label="Método" value={order.shipping_method} />
                )}
              </dl>
            </Panel>

            <Panel title="Pago" index={nextIndex()} visible={pageMounted}>
              <dl className="text-sm text-[#ececec] space-y-1.5">
                <Row label="Estado" value={paymentStatusLabel(order.payment_status)} />
                <Row label="Proveedor" value={order.payment_provider ?? "—"} />
                <Row
                  label="Referencia"
                  value={
                    order.payment_reference ? (
                      <span className="font-mono text-xs">
                        {order.payment_reference}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
                <Row
                  label="Pagado"
                  value={order.paid_at ? formatDate(order.paid_at) : "—"}
                />
              </dl>
            </Panel>

            {order.notes && (
              <Panel title="Notas" index={nextIndex()} visible={pageMounted}>
                <p className="text-sm text-[#ececec] whitespace-pre-wrap">
                  {order.notes}
                </p>
              </Panel>
            )}
          </div>

          {/* ──────── Right column: totals + actions ──────── */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Panel title="Total" index={nextIndex()} visible={pageMounted}>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between text-[#a5a5a5]">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums text-[#ececec]">
                    {formatPrice(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between text-[#a5a5a5]">
                  <dt>Envío</dt>
                  <dd className="tabular-nums text-[#ececec]">
                    {order.shipping_cost > 0
                      ? formatPrice(order.shipping_cost)
                      : "Gratis"}
                  </dd>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-[#a5a5a5]">
                    <dt>Descuento</dt>
                    <dd className="tabular-nums text-emerald-300">
                      −{formatPrice(order.discount)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-3 border-t border-[#c9a96e]/20">
                  <dt className="text-[#ececec]">Total</dt>
                  <dd className="tabular-nums text-[#c9a96e]">
                    {formatPrice(order.total)}
                  </dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Acciones" index={nextIndex()} visible={pageMounted}>
              <div className="space-y-2">
                {canMarkPaid && (
                  <ActionButton
                    label="Marcar pagado"
                    onClick={runMarkPaid}
                    disabled={isPending}
                    variant="primary"
                  />
                )}
                {canConfirm && (
                  <ActionButton
                    label="Confirmar (Recibido)"
                    onClick={() => runAdvance("received")}
                    disabled={isPending}
                    variant="primary"
                  />
                )}
                {canShip && (
                  <ActionButton
                    label="Marcar enviado"
                    onClick={() => runAdvance("shipped")}
                    disabled={isPending}
                    variant="primary"
                  />
                )}
                {canDeny && (
                  <ActionButton
                    label="Cancelar pedido"
                    onClick={runDeny}
                    disabled={isPending}
                    variant="danger"
                  />
                )}
                {!canMarkPaid && !canConfirm && !canShip && !canDeny && (
                  <p className="text-xs text-[#a5a5a5] py-2">
                    No hay acciones disponibles para este estado.
                  </p>
                )}
              </div>
            </Panel>

            <Panel title="Origen" index={nextIndex()} visible={pageMounted}>
              <p className="text-xs text-[#a5a5a5]">
                <span className="text-[#ececec]">{order.source}</span>
                <br />
                Creado: {formatDate(order.created_at)}
                <br />
                Actualizado: {formatDate(order.updated_at)}
              </p>
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function Panel({
  title,
  children,
  index,
  visible,
}: {
  title: string;
  children: React.ReactNode;
  index?: number;
  visible?: boolean;
}) {
  const delay = `${(index ?? 0) * 80}ms`;
  const style = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(-8px)",
    transition: `opacity 300ms ease ${delay}, transform 300ms ease ${delay}`,
    willChange: "opacity, transform",
  };

  return (
    <section style={style} className="rounded-2xl border border-[#c9a96e]/20 bg-[#1a1a1a] p-4 sm:p-5">
      <h2 className="text-xs uppercase tracking-wider text-[#a5a5a5] mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3">
      <dt className="text-[#a5a5a5] sm:w-32 shrink-0">{label}</dt>
      <dd className="text-[#ececec] break-words">{value}</dd>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "danger";
}) {
  const variantCls =
    variant === "primary"
      ? "bg-[#c9a96e] text-black hover:bg-[#b8a060]"
      : "bg-red-600/90 text-white hover:bg-red-600 border border-red-600";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${variantCls}`}
    >
      {disabled ? "Procesando…" : label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Pendiente", "bg-amber-500/20 text-amber-200"],
    received: ["Recibido", "bg-blue-500/20 text-blue-200"],
    shipped: ["Enviado", "bg-emerald-500/20 text-emerald-200"],
    denied: ["Cancelado", "bg-red-500/20 text-red-200"],
  };
  const [label, cls] = map[status] ?? [status, "bg-gray-500/20 text-gray-200"];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Pago pendiente", "bg-amber-500/20 text-amber-200"],
    paid: ["Pagado", "bg-emerald-500/20 text-emerald-200"],
    failed: ["Pago fallido", "bg-red-500/20 text-red-200"],
    refunded: ["Reembolsado", "bg-purple-500/20 text-purple-200"],
  };
  const [label, cls] = map[status] ?? [status, "bg-gray-500/20 text-gray-200"];
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function paymentStatusLabel(status: string): string {
  return (
    {
      pending: "Pendiente",
      paid: "Pagado",
      failed: "Fallido",
      refunded: "Reembolsado",
    }[status] ?? status
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
