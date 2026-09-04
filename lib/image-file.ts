/**
 * Getting a photo off an iPhone and into an upload.
 *
 * Two things stopped hosts uploading the picture they'd just taken:
 *
 * 1. A narrow `accept` list. iOS applies it to the photo library itself, so a
 *    filter of "png, jpeg, webp" greys out every HEIC — which is what a modern
 *    iPhone shoots by default. Nothing was selectable and nothing explained why.
 *
 * 2. A hard size limit. A 12 MP photo is routinely 4–12 MB, so a limit meant to
 *    stop abuse was instead rejecting the ordinary case. An image displayed a
 *    few hundred pixels wide has no use for a 4032px original, so we re-encode
 *    it to fit rather than telling the host to go and edit their photo.
 */

/**
 * `image/*` covers the normal cases; the explicit extensions cover platforms
 * that hand over HEIC/HEIF with an empty or unrecognised MIME type.
 */
export const ACCEPT_IMAGES =
  "image/*,.heic,.heif,.avif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff";

const IMAGE_EXTENSIONS = new Set([
  "jpg", "jpeg", "jpe", "png", "webp", "gif", "avif", "heic", "heif",
  "bmp", "tif", "tiff", "svg", "ico",
]);

const HEIC = /^(heic|heif)$/i;

function extensionOf(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

/** Some platforms report HEIC as "" or application/octet-stream — fall back to the extension. */
export function looksLikeImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.has(extensionOf(file));
}

/** A format only Safari can render, so it can't be served as-is from plain storage. */
export function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || HEIC.test(extensionOf(file));
}

export function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type PrepareOptions = {
  /** Upload ceiling. Anything larger is re-encoded down to fit. */
  maxBytes: number;
  /** Longest edge worth keeping for how the image is actually displayed. */
  maxEdge: number;
  /**
   * Re-encode HEIC to JPEG even when it's small enough. Needed wherever the
   * bytes are served back verbatim — a .heic URL is a broken image in every
   * browser but Safari.
   */
  transcodeHeic?: boolean;
};

/**
 * Re-encode a photo so it fits, and so it can be displayed once it lands.
 *
 * Decoding happens in the browser, so this can only convert formats the
 * browser understands. Safari decodes HEIC, other browsers don't — which is
 * fine, because an iPhone is where the HEIC comes from in the first place.
 * When we can't decode we hand back the original and let the caller decide
 * whether that's usable.
 */
export async function prepareImage(
  file: File,
  { maxBytes, maxEdge, transcodeHeic = false }: PrepareOptions
): Promise<File> {
  const mustTranscode = transcodeHeic && isHeic(file);
  if (file.size <= maxBytes && !mustTranscode) return file;
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    // Step the quality down until it fits rather than guessing once.
    let smallest: File | null = null;
    for (const quality of [0.85, 0.7, 0.55]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (!blob) continue;
      smallest = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
        type: "image/jpeg",
      });
      if (blob.size <= maxBytes) return smallest;
    }
    // Still too big, but a re-encoded JPEG is at least displayable — the caller
    // reports the honest size from here.
    return smallest ?? file;
  } finally {
    bitmap.close();
  }
}
