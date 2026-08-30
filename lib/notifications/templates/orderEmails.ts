import type { NotificationType, OrderNotificationData } from "../types";
import {
  brand,
  ctaButton,
  detailRow,
  esc,
  formatCRC,
  formatDateTime,
  orderHandle,
  panel,
  statusPill,
  wrapEmail,
} from "./layout";

/** A fully-rendered email, provider-agnostic. */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** Human label for a payment method, in Spanish. */
function methodLabel(data: OrderNotificationData): string {
  switch (data.paymentMethod) {
    case "card":
      return "Tarjeta (ONVO)";
    case "sinpe":
      return "SINPE Móvil";
    default:
      return data.paymentProvider ?? "Otro";
  }
}

function productTypeLabel(type: "full_size" | "decant" | "set"): string {
  if (type === "decant") return "Decant";
  if (type === "set") return "Set";
  return "Tamaño completo";
}

/**
 * Router: render the correct email for a notification type. Keeps callers from
 * knowing which builder to pick — they pass the type, they get an email.
 */
export function renderOrderEmail(
  type: NotificationType,
  data: OrderNotificationData,
  adminOrderUrl: string
): RenderedEmail {
  return type === "sinpe_order_pending"
    ? renderSinpeOrderPendingEmail(data, adminOrderUrl)
    : renderPaymentConfirmedEmail(data, adminOrderUrl);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🟡 New SINPE order — payment pending
// ─────────────────────────────────────────────────────────────────────────────

export function renderSinpeOrderPendingEmail(
  data: OrderNotificationData,
  adminOrderUrl: string
): RenderedEmail {
  const handle = orderHandle(data.orderNumber);
  const subject = `🟡 Krov — Nuevo pedido ${handle} — Pago pendiente`;

  const banner =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
    `style="background:${brand.amber}14;border:1px solid ${brand.amber}55;border-radius:10px;margin:0 0 18px 0;">` +
    `<tr><td style="padding:14px 16px;color:${brand.text};font-size:13px;line-height:1.6;">` +
    `<strong style="color:${brand.amber};">Acción requerida:</strong> verifica el pago por SINPE Móvil ` +
    `antes de preparar y enviar el pedido. El stock ya está reservado.` +
    `</td></tr></table>`;

  const body =
    banner +
    orderPanel(data, "Pendiente", brand.amber) +
    customerPanel(data) +
    itemsPanel(data) +
    shippingPanel(data) +
    ctaButton(adminOrderUrl, "Ver pedido en el panel");

  const html = wrapEmail({
    title: `Nuevo pedido ${handle} — pago pendiente por SINPE`,
    accent: brand.amber,
    heading: `🟡 Nuevo pedido ${handle}`,
    body,
  });

  return { subject, html, text: buildText(data, adminOrderUrl, "pending") };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🟢 Payment confirmed (card via webhook, or SINPE marked paid)
// ─────────────────────────────────────────────────────────────────────────────

export function renderPaymentConfirmedEmail(
  data: OrderNotificationData,
  adminOrderUrl: string
): RenderedEmail {
  const handle = orderHandle(data.orderNumber);
  const isCard = data.paymentMethod === "card";

  // Card orders never got a "pending" email, so this doubles as the new-order
  // alert. SINPE orders already got one, so this is purely the confirmation.
  const subject = isCard
    ? `🟢 Krov — Nuevo pedido ${handle} — Pago confirmado`
    : `🟢 Krov — Pago confirmado del pedido ${handle}`;

  const banner =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
    `style="background:${brand.green}14;border:1px solid ${brand.green}55;border-radius:10px;margin:0 0 18px 0;">` +
    `<tr><td style="padding:14px 16px;color:${brand.text};font-size:13px;line-height:1.6;">` +
    `<strong style="color:${brand.green};">Pago confirmado.</strong> ` +
    (isCard
      ? `El pago con tarjeta fue procesado por ONVO. Ya puedes preparar el pedido.`
      : `El pago por SINPE Móvil fue validado. Ya puedes preparar el pedido.`) +
    `</td></tr></table>`;

  const body =
    banner +
    orderPanel(data, "Pagado", brand.green) +
    customerPanel(data) +
    itemsPanel(data) +
    shippingPanel(data) +
    ctaButton(adminOrderUrl, "Ver pedido en el panel");

  const html = wrapEmail({
    title: `Pago confirmado — pedido ${handle}`,
    accent: brand.green,
    heading: isCard
      ? `🟢 Nuevo pedido ${handle} — Pago confirmado`
      : `🟢 Pago confirmado — ${handle}`,
    body,
  });

  return { subject, html, text: buildText(data, adminOrderUrl, "paid") };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared HTML sections
// ─────────────────────────────────────────────────────────────────────────────

function orderPanel(
  data: OrderNotificationData,
  statusLabel: string,
  statusColor: string
): string {
  const rows =
    detailRow("Pedido", esc(orderHandle(data.orderNumber))) +
    detailRow("Fecha", esc(formatDateTime(data.createdAt))) +
    detailRow("Método de pago", esc(methodLabel(data))) +
    detailRow("Estado de pago", statusPill(statusLabel, statusColor)) +
    detailRow(
      "Total",
      `<span style="font-size:16px;color:${brand.redSoft};font-weight:800;">${esc(
        formatCRC(data.total)
      )}</span>`
    ) +
    detailRow(
      "ID interno",
      `<span style="color:${brand.muted};font-size:11px;">${esc(data.id)}</span>`
    );

  return panel(
    "Pedido",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
  );
}

function customerPanel(data: OrderNotificationData): string {
  const rows =
    detailRow("Nombre", esc(data.customer.name)) +
    detailRow("Teléfono", esc(data.customer.phone)) +
    (data.customer.email
      ? detailRow("Correo", esc(data.customer.email))
      : "");

  return panel(
    "Cliente",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
  );
}

function itemsPanel(data: OrderNotificationData): string {
  const header =
    `<tr>` +
    `<th align="left" style="padding:0 0 8px 0;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid ${brand.border};">Producto</th>` +
    `<th align="center" style="padding:0 0 8px 0;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid ${brand.border};">Cant.</th>` +
    `<th align="right" style="padding:0 0 8px 8px;color:${brand.muted};font-size:11px;text-transform:uppercase;letter-spacing:.08em;border-bottom:1px solid ${brand.border};">Subtotal</th>` +
    `</tr>`;

  const rows = data.items
    .map((item) => {
      const name =
        `<div style="color:${brand.text};font-weight:600;">${esc(
          item.brandName
        )} — ${esc(item.productName)}</div>` +
        `<div style="color:${brand.muted};font-size:12px;margin-top:2px;">` +
        `${esc(productTypeLabel(item.productType))} · ${esc(item.sizeMl)} ml · ${esc(
          item.sku
        )}<br>${esc(formatCRC(item.unitPrice))} c/u</div>`;
      return (
        `<tr>` +
        `<td style="padding:10px 0;border-bottom:1px solid ${brand.border};vertical-align:top;">${name}</td>` +
        `<td align="center" style="padding:10px 0;border-bottom:1px solid ${brand.border};vertical-align:top;color:${brand.text};font-weight:600;">${esc(
          item.quantity
        )}</td>` +
        `<td align="right" style="padding:10px 0 10px 8px;border-bottom:1px solid ${brand.border};vertical-align:top;color:${brand.text};font-weight:600;white-space:nowrap;">${esc(
          formatCRC(item.lineTotal)
        )}</td>` +
        `</tr>`
      );
    })
    .join("");

  const totals =
    totalsRow("Subtotal", formatCRC(data.subtotal), brand.muted) +
    (data.discount > 0
      ? totalsRow("Descuento", `- ${formatCRC(data.discount)}`, brand.muted)
      : "") +
    totalsRow(
      "Envío",
      data.shippingCost > 0 ? formatCRC(data.shippingCost) : "Gratis",
      brand.muted
    ) +
    totalsRow("Total", formatCRC(data.total), brand.redSoft, true);

  return panel(
    "Productos",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;">` +
      header +
      rows +
      totals +
      `</table>`
  );
}

function totalsRow(
  label: string,
  value: string,
  color: string,
  strong = false
): string {
  const weight = strong ? "800" : "600";
  const size = strong ? "15px" : "13px";
  return (
    `<tr>` +
    `<td colspan="2" align="right" style="padding:${
      strong ? "12px" : "6px"
    } 8px 0 0;color:${strong ? brand.text : brand.muted};font-size:${size};font-weight:${weight};">${esc(
      label
    )}</td>` +
    `<td align="right" style="padding:${
      strong ? "12px" : "6px"
    } 0 0 8px;color:${color};font-size:${size};font-weight:${weight};white-space:nowrap;">${esc(
      value
    )}</td>` +
    `</tr>`
  );
}

function shippingPanel(data: OrderNotificationData): string {
  const s = data.shipping;
  const rows =
    detailRow("Provincia", esc(s.province)) +
    detailRow("Cantón", esc(s.canton)) +
    detailRow("Distrito", esc(s.district)) +
    detailRow("Dirección", esc(s.address)) +
    (s.reference ? detailRow("Referencia", esc(s.reference)) : "");

  return panel(
    "Envío",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Plaintext fallback
// ─────────────────────────────────────────────────────────────────────────────

function buildText(
  data: OrderNotificationData,
  adminOrderUrl: string,
  state: "pending" | "paid"
): string {
  const lines: string[] = [];
  lines.push(`KROV — Notificación de pedido`);
  lines.push("");
  lines.push(
    state === "pending"
      ? `Nuevo pedido ${orderHandle(data.orderNumber)} — PAGO PENDIENTE (SINPE Móvil)`
      : `Pago confirmado — pedido ${orderHandle(data.orderNumber)}`
  );
  lines.push("");
  lines.push(`Fecha: ${formatDateTime(data.createdAt)}`);
  lines.push(`Método de pago: ${methodLabel(data)}`);
  lines.push(`Estado de pago: ${state === "pending" ? "PENDIENTE" : "PAGADO"}`);
  lines.push(`Total: ${formatCRC(data.total)}`);
  lines.push("");
  lines.push(`Cliente: ${data.customer.name}`);
  lines.push(`Teléfono: ${data.customer.phone}`);
  if (data.customer.email) lines.push(`Correo: ${data.customer.email}`);
  lines.push("");
  lines.push("Productos:");
  for (const item of data.items) {
    lines.push(
      `  - ${item.brandName} — ${item.productName} (${productTypeLabel(
        item.productType
      )}, ${item.sizeMl} ml) x${item.quantity} = ${formatCRC(item.lineTotal)}`
    );
  }
  lines.push("");
  lines.push(`Subtotal: ${formatCRC(data.subtotal)}`);
  if (data.discount > 0) lines.push(`Descuento: -${formatCRC(data.discount)}`);
  lines.push(
    `Envío: ${data.shippingCost > 0 ? formatCRC(data.shippingCost) : "Gratis"}`
  );
  lines.push(`TOTAL: ${formatCRC(data.total)}`);
  lines.push("");
  lines.push("Envío:");
  lines.push(
    `  ${data.shipping.province}, ${data.shipping.canton}, ${data.shipping.district}`
  );
  lines.push(`  ${data.shipping.address}`);
  if (data.shipping.reference) lines.push(`  Ref: ${data.shipping.reference}`);
  lines.push("");
  lines.push(`Ver pedido: ${adminOrderUrl}`);
  return lines.join("\n");
}
