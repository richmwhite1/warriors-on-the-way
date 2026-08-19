// Shared helper for dynamic Open Graph images (next/og + Satori).
//
// Satori can only rasterize JPEG and PNG bitmaps — WebP / AVIF / GIF either crash
// or hang the renderer, which surfaces as a 500 on the opengraph-image route. So we
// only embed a fetched background when it's a supported format, guard the fetch with
// a hard timeout (a slow asset must never hang the function), and cap the size.
// Returns null to fall back to the branded gradient card.
export async function fetchOgBackground(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timer),
    );
    if (!res.ok) return null;

    const ct = (res.headers.get("content-type") ?? "").toLowerCase();
    const supported = ct.includes("jpeg") || ct.includes("jpg") || ct.includes("png");
    if (!supported) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength > 5_000_000) return null; // base64 of huge images bloats render

    return `data:${ct};base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}
