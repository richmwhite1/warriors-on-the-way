import { isMapLink, isShortMapLink, normalizeMapLink } from "@/lib/maps";

/**
 * Expand a Google Maps share link once, when the host saves the event.
 *
 * `https://maps.app.goo.gl/…` is what the Maps app gives you when you hit
 * Share, so it's what hosts paste — but it can't be read on the client, and
 * what it redirects to is a URL the iOS Maps app refuses (see lib/maps.ts).
 * Following it here, once, lets us store the documented `?api=1&query=` form
 * instead, so every guest who taps it afterwards gets a working link.
 *
 * Best-effort by design: if Google is slow or unreachable we save what the
 * host typed rather than failing their event. The render path still falls back
 * to the address text, so a link we couldn't expand is never a dead end.
 */
export async function resolveMapUrl(
  value: string | null | undefined
): Promise<string | null> {
  const raw = value?.trim();
  if (!raw) return null;
  if (!isMapLink(raw)) return raw;

  const direct = normalizeMapLink(raw);
  if (direct) return direct;
  if (!isShortMapLink(raw)) return raw;

  try {
    const res = await fetch(raw, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
      // Google hands short links to a JS interstitial without a browser UA.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      },
    });
    return normalizeMapLink(res.url) ?? raw;
  } catch {
    return raw;
  }
}
