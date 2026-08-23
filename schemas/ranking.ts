/**
 * Public username + leaderboard opt-in validation.
 *
 * One schema, used in three places:
 *   1. Live feedback in the profile UI (RankingSettingsCard).
 *   2. Server-side re-validation inside updateRankingSettingsAction — the action
 *      is the trust boundary, the card is a convenience.
 *   3. Mirrored by CHECK constraints in migration 20260823000100, which is the
 *      boundary that actually holds: RLS lets a user UPDATE their own profile
 *      row directly, so the database has to be able to refuse a bad username on
 *      its own. These rules and those constraints must stay in lockstep.
 */

import { z } from "zod";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/**
 * Mirrors `profiles_username_format`. Alphanumerics plus `.` and `_`, and it
 * must start and end alphanumeric — that bookend rule is what rejects names
 * reading as truncated ("krov…"), all-punctuation names, and names that differ
 * from an existing one only by surrounding separators.
 *
 * ASCII-only, deliberately: homoglyphs and bidirectional overrides are the
 * standard impersonation vector on a public list of names.
 */
export const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._]{1,18}[A-Za-z0-9]$/;

/** Mirrors `profiles_username_not_reserved`. Compared lowercased. */
export const RESERVED_USERNAMES: readonly string[] = [
  "admin",
  "administrador",
  "administrator",
  "krov",
  "krovperfumeria",
  "moderador",
  "moderator",
  "root",
  "soporte",
  "support",
  "system",
  "sistema",
  "staff",
  "oficial",
  "official",
  "null",
  "undefined",
] as const;

/**
 * A username the user actually filled in. Trimmed first, so " aurora " and
 * "aurora" are the same submission; the pattern then forbids interior
 * whitespace, which is what makes the trim sufficient rather than cosmetic.
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, {
    message: `El usuario debe tener al menos ${USERNAME_MIN_LENGTH} caracteres`,
  })
  .max(USERNAME_MAX_LENGTH, {
    message: `El usuario no puede superar los ${USERNAME_MAX_LENGTH} caracteres`,
  })
  .regex(USERNAME_PATTERN, {
    message:
      "Usa solo letras, números, punto o guion bajo, empezando y terminando con una letra o número",
  })
  .refine((value) => !RESERVED_USERNAMES.includes(value.toLowerCase()), {
    message: "Ese nombre de usuario está reservado",
  });

/**
 * The full settings payload.
 *
 * `username` accepts an empty string as "I have no public username" and
 * normalizes it to `null`, so clearing the field is a first-class action rather
 * than a validation failure. The refine below is the reason the two fields are
 * validated together: opting in without a name is the one combination that is
 * individually valid on both fields and invalid as a pair.
 */
export const rankingSettingsSchema = z
  .object({
    username: z
      .union([z.literal(""), usernameSchema])
      .transform((value) => (value === "" ? null : value)),
    show_in_ranking: z.boolean(),
  })
  .refine((data) => !data.show_in_ranking || data.username !== null, {
    path: ["show_in_ranking"],
    message: "Necesitas un nombre de usuario para aparecer en el ranking",
  });

/** What the form holds (pre-transform): `username` is always a string. */
export type RankingSettingsFormValues = z.input<typeof rankingSettingsSchema>;

/** What the action writes (post-transform): `username` is `string | null`. */
export type RankingSettingsInput = z.output<typeof rankingSettingsSchema>;

/**
 * Whether a raw input value would pass {@link usernameSchema}.
 *
 * The UI needs this on every keystroke to decide if the opt-in toggle can be
 * enabled — parsing the whole object there would also surface the "needs a
 * username" error while the user is still typing one.
 */
export function isValidUsername(value: string): boolean {
  return usernameSchema.safeParse(value).success;
}
