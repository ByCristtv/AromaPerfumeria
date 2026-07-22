/**
 * Client-side image compression.
 *
 * A single, dependency-free service that every product-image upload flow runs
 * its files through *before* they reach Supabase Storage. It downscales
 * oversized images, re-encodes them at a high-but-efficient quality, and (as a
 * free side effect of canvas re-encoding) strips EXIF/metadata.
 *
 * Design goals:
 *   - Reusable: the upload layer (`services/uploadProductImage.ts`) receives an
 *     already-optimized File and stays ignorant of *how* it was optimized.
 *   - Safe: never upscale, never emit a file larger than the original, and
 *     never silently produce a corrupted file — on any failure we throw a
 *     clear, user-facing error so the caller can abort the upload.
 *   - Transparent: same File contract in/out, so naming conventions and the
 *     rest of the pipeline keep working unchanged.
 */

export interface CompressImageOptions {
  /** Longest edge (px) the output may reach. Images already smaller are left
   *  at their native size — we never upscale. Default 1600. */
  maxDimension?: number;
  /** Lossy encoder quality, 0–1. Default 0.82 (visually excellent, small). */
  quality?: number;
  /** Output MIME type. Default "image/webp" — great compression + alpha. */
  mimeType?: "image/webp" | "image/jpeg";
}

const DEFAULTS: Required<CompressImageOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  mimeType: "image/webp",
};

/** Extensions we swap the filename to, keyed by output MIME. */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
};

/**
 * Compress a single image File. Returns a new, optimized File on success.
 *
 * If the source isn't a raster image we can decode (or the browser lacks the
 * needed APIs), the original File is returned untouched — compression is a
 * best-effort optimization, not a gate. Genuine decode/encode failures throw.
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Only raster images are compressible. SVGs, unknown types, or a
  // non-browser (SSR) context fall through unchanged.
  if (
    typeof document === "undefined" ||
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // `imageOrientation: "from-image"` bakes in EXIF rotation so the output
    // isn't sideways once the original metadata is dropped.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // Couldn't decode (corrupt or unsupported). Don't upload a file we can't
    // even read — surface a clear error.
    throw new Error("No pudimos procesar la imagen. Verifica que el archivo no esté dañado.");
  }

  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height, opts.maxDimension);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No pudimos optimizar la imagen (canvas no disponible).");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, opts.mimeType, opts.quality);
    if (!blob) {
      throw new Error("No pudimos optimizar la imagen. Intenta con otro archivo.");
    }

    // Guard against pathological cases (tiny already-optimized images can grow
    // when re-encoded) — keep whichever is smaller.
    if (blob.size >= file.size) {
      return file;
    }

    return new File([blob], renameForMime(file.name, opts.mimeType), {
      type: opts.mimeType,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Scale (w, h) down to fit inside a maxDimension × maxDimension box, preserving
 * aspect ratio. Never enlarges — if it already fits, dimensions are unchanged.
 */
function fitWithin(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height };
  }
  const scale = maxDimension / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/** Promise wrapper around the callback-based canvas.toBlob. */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

/** Swap a filename's extension to match the compressed output format. */
function renameForMime(originalName: string, mimeType: string): string {
  const ext = EXTENSION_BY_MIME[mimeType] ?? "webp";
  const base = originalName.replace(/\.[^./\\]+$/, "");
  return `${base || "image"}.${ext}`;
}
