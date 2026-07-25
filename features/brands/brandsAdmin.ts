import { supabase } from "@/lib/supabase/client";
import { slugify } from "@/lib/slug";
import type { Database } from "@/types/database";

/** Full brand row as stored (admin RLS returns every brand, active or not). */
export type BrandRow = Database["public"]["Tables"]["brands"]["Row"];

/** React Query key for the admin brands list. */
export const ADMIN_BRANDS_QUERY_KEY = ["admin", "brands"] as const;

/**
 * Fields the admin form owns. `slug` is derived from `name` when omitted so the
 * admin never has to think about URLs, but stays overridable for edge cases
 * (two brands that would collide, manual SEO tweaks).
 */
export interface BrandInput {
  name: string;
  slug?: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

/** Fetch every brand for the admin table (newest first). */
export async function getBrandsAdmin(): Promise<BrandRow[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Create a brand. Slug defaults to a slugified name. */
export async function createBrand(input: BrandInput): Promise<BrandRow> {
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugify(name)).trim();

  const { data, error } = await supabase
    .from("brands")
    .insert({
      name,
      slug,
      description: emptyToNull(input.description),
      logo_url: emptyToNull(input.logo_url),
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(friendlyWriteError(error.message));
  return data;
}

/** Update an existing brand by id. */
export async function updateBrand(
  id: string,
  input: BrandInput
): Promise<BrandRow> {
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugify(name)).trim();

  const { data, error } = await supabase
    .from("brands")
    .update({
      name,
      slug,
      description: emptyToNull(input.description),
      logo_url: emptyToNull(input.logo_url),
      is_active: input.is_active ?? true,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(friendlyWriteError(error.message));
  return data;
}

/**
 * Delete a brand by id.
 *
 * `products.brand_id` is NOT NULL and references brands, so Postgres raises a
 * foreign-key violation (SQLSTATE 23503) if any product still points here. We
 * translate that into a human message instead of leaking the raw constraint.
 */
export async function deleteBrand(id: string): Promise<void> {
  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) {
    if (error.code === "23503" || /foreign key/i.test(error.message)) {
      throw new Error(
        "No se puede eliminar esta marca porque tiene productos asociados. " +
          "Reasigna o elimina esos productos primero."
      );
    }
    throw new Error(error.message);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function emptyToNull(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

/** Turn UNIQUE-constraint violations into a message the admin can act on. */
function friendlyWriteError(message: string): string {
  if (/duplicate key|unique/i.test(message)) {
    return "Ya existe una marca con ese nombre o slug.";
  }
  return message;
}
