/**
 * Costa Rica administrative geography types.
 *
 * Codes follow the official INEC/TSE encoding:
 *   - province: 1 digit  (1 = San José, ..., 7 = Limón)
 *   - canton:   3 digits (first digit = province)
 *   - district: 5 digits (first 3 digits = canton)
 *
 * All codes are stored as zero-padded strings, NEVER numbers. Postgres
 * canton_code is TEXT, and leading-zero bugs are a real risk if codes
 * are converted to numbers at any point in the pipeline.
 */

export interface Province {
  /** 1-digit code, e.g. "1" for San José. */
  code: string;
  /** Display name in Spanish. */
  name: string;
}

export interface Canton {
  /** 3-digit code, e.g. "101" for San José/San José. */
  code: string;
  /** Display name in Spanish. */
  name: string;
  /** Parent province code (= canton code's first digit). */
  provinceCode: string;
}

export interface District {
  /** 5-digit code, e.g. "10101" for San José/San José/Carmen. */
  code: string;
  /** Display name in Spanish. */
  name: string;
  /** Parent canton code (= district code's first 3 digits). */
  cantonCode: string;
}
