/**
 * Krov email layout + formatting primitives.
 *
 * Everything email templates share lives here: the brand shell, currency/date
 * formatting, and — critically — HTML escaping. All dynamic values (customer
 * name, address, product names) MUST pass through `esc()` before interpolation
 * so a value like `O'Brien & <Co>` can never break the markup or inject HTML.
 *
 * Email-client reality: no external CSS, no flexbox/grid you can trust, no
 * <style> in some clients. So this is table-based layout with inline styles and
 * web-safe fonts only. Dark, red-accented, high-contrast — the Krov identity.
 */

/** Krov brand palette (dark, futuristic, red accent). */
export const brand = {
  bg: "#0a0a0b",
  panel: "#141417",
  panelAlt: "#1c1c21",
  border: "#2a2a30",
  text: "#f5f5f7",
  muted: "#9a9aa5",
  red: "#e10600",
  redSoft: "#ff2a20",
  amber: "#f5a623",
  green: "#22c55e",
} as const;

export const FONT_STACK =
  "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', sans-serif";

/** Escape a string for safe interpolation into HTML. */
export function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Costa Rican colón, no decimals — e.g. 45000 → "₡45 000". */
export function formatCRC(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Human date+time in Costa Rica time. */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Costa_Rica",
  }).format(new Date(iso));
}

/** Order number rendered as the KR-#### handle used across the store. */
export function orderHandle(orderNumber: number): string {
  return `KR-${orderNumber}`;
}

/** A colored status pill (pending/paid/etc.). Text is escaped by the caller. */
export function statusPill(label: string, color: string): string {
  return (
    `<span style="display:inline-block;padding:4px 12px;border-radius:999px;` +
    `background:${color}1a;color:${color};border:1px solid ${color}55;` +
    `font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">` +
    `${esc(label)}</span>`
  );
}

/** A primary call-to-action button (bulletproof-ish table anchor). */
export function ctaButton(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0;">` +
    `<tr><td align="center" bgcolor="${brand.red}" style="border-radius:8px;">` +
    `<a href="${esc(href)}" target="_blank" ` +
    `style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};` +
    `font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">` +
    `${esc(label)}</a>` +
    `</td></tr></table>`
  );
}

/**
 * Wrap body content in the full Krov email document.
 *
 * @param opts.title      preheader / hidden inbox-preview text
 * @param opts.accent     hex accent for the top rule (varies by email type)
 * @param opts.heading    big headline at the top of the card
 * @param opts.body       inner HTML (already escaped by its builder)
 */
export function wrapEmail(opts: {
  title: string;
  accent: string;
  heading: string;
  body: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${brand.panel};border:1px solid ${brand.border};border-radius:14px;overflow:hidden;font-family:${FONT_STACK};">
      <!-- brand bar -->
      <tr><td style="height:4px;background:${opts.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:28px 32px 8px 32px;">
        <div style="font-size:22px;font-weight:800;letter-spacing:.28em;color:${brand.text};">KROV</div>
        <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:${brand.muted};margin-top:2px;">Perfumería · Notificación de pedido</div>
      </td></tr>
      <!-- heading -->
      <tr><td style="padding:16px 32px 0 32px;">
        <h1 style="margin:0;font-size:20px;line-height:1.3;font-weight:800;color:${brand.text};">${esc(opts.heading)}</h1>
      </td></tr>
      <!-- body -->
      <tr><td style="padding:20px 32px 8px 32px;color:${brand.text};font-size:14px;line-height:1.6;">
        ${opts.body}
      </td></tr>
      <!-- footer -->
      <tr><td style="padding:24px 32px 30px 32px;border-top:1px solid ${brand.border};">
        <p style="margin:0;color:${brand.muted};font-size:12px;line-height:1.6;">
          Este es un correo automático de la tienda Krov. Se envía cuando ocurre un evento en un pedido.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Build a definition-list style row (label / value) for the details panel. */
export function detailRow(label: string, valueHtml: string): string {
  return (
    `<tr>` +
    `<td style="padding:6px 0;color:${brand.muted};font-size:13px;width:42%;vertical-align:top;">${esc(label)}</td>` +
    `<td style="padding:6px 0;color:${brand.text};font-size:13px;font-weight:600;vertical-align:top;">${valueHtml}</td>` +
    `</tr>`
  );
}

/** A titled panel section. */
export function panel(title: string, innerHtml: string): string {
  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ` +
    `style="background:${brand.panelAlt};border:1px solid ${brand.border};border-radius:10px;margin:0 0 16px 0;">` +
    `<tr><td style="padding:16px 18px;">` +
    `<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${brand.muted};margin-bottom:10px;">${esc(title)}</div>` +
    innerHtml +
    `</td></tr></table>`
  );
}
