/**
 * Normalize a Costa Rican phone number to E.164 for Onvo.
 *
 * Onvo's POST /v1/customers rejects anything that isn't a valid E.164 number
 * ("phone must be a valid phone number"), but the checkout form collects phones
 * the way Costa Ricans write them — "8888-8888", "8888 8888", "88888888". Left
 * raw, every card checkout with a locally-formatted number 400s at customer
 * creation. This bridges the two.
 *
 * Scope is deliberately CR-only (the storefront ships nationally and the form has
 * no country selector): an 8-digit local number becomes +506XXXXXXXX. Anything
 * already in +… form, or that we can't confidently interpret, is passed through
 * untouched so Onvo remains the final validator rather than us silently mangling
 * an edge case.
 */
export function toCostaRicaE164(raw: string): string {
  const trimmed = raw.trim();

  // Already E.164 (or attempting to be) — strip spaces/dashes, keep the +.
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }

  const digits = trimmed.replace(/\D/g, "");

  // Local 8-digit CR number → prepend the country code.
  if (digits.length === 8) {
    return `+506${digits}`;
  }

  // Country code included without the plus (e.g. "50688888888").
  if (digits.length === 11 && digits.startsWith("506")) {
    return `+${digits}`;
  }

  // Unrecognized shape — hand it over as digits and let Onvo decide.
  return digits ? `+${digits}` : trimmed;
}
