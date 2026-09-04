/**
 * Building a Maps link that actually opens directions on a phone.
 *
 * Most of our guests tap these on an iPhone, where a URL is handed to the
 * Google Maps app rather than a browser. The app is far pickier than the web
 * map, and three separate things were breaking a tapped location.
 *
 * 1. Google's own share links don't survive the hand-off. Pasting a
 *    `https://maps.app.goo.gl/…` link looks right — it's what the Maps app
 *    emits when you hit Share — but it redirects to
 *    `maps.google.com/maps?q=<text>&ftid=<hex:hex>&entry=gps&…`, and the iOS app
 *    keys off the `ftid` feature id, which it can't look up. Result: the app
 *    opens and says "location not found", which is what happened to the End of
 *    Summer Float Party at Trial Lake. The `q=` text right there in the URL
 *    would have worked fine — so we take the text and drop the rest.
 *
 * 2. `?cid=` links have the same shape of problem: an opaque number only
 *    Google's *web* map can resolve, with no text to fall back on.
 *
 * 3. `maps.google.com/?q=` is a legacy web redirect. Google's documented
 *    cross-platform contract is the Maps URLs API:
 *      https://www.google.com/maps/search/?api=1&query=<text>[&query_place_id=<id>]
 *    It opens the Maps app on iOS and Android and the web map on desktop, and
 *    lands on a pin with a Directions button one tap away.
 *
 * So: never pass a Google link through untouched. Reduce it to the place text
 * it contains and rebuild the documented URL around that. A link we can't
 * reduce is worse than the address the host typed, so we fall back to that.
 */

const HTTP_URL = /^https?:\/\//i;

/** A pasted map link (or any URL) already points somewhere — don't search for it. */
export function isMapLink(value?: string | null): boolean {
  return typeof value === "string" && HTTP_URL.test(value.trim());
}

/** The documented cross-platform search URL — opens the Maps app on iOS/Android. */
export function mapsSearchUrl(query: string, placeId?: string | null): string {
  const params = new URLSearchParams({ api: "1", query });
  if (placeId) params.set("query_place_id", placeId);
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

/** Short links can only be resolved by following the redirect — see lib/maps-server.ts. */
export function isShortMapLink(url: string): boolean {
  return /(^|\/\/|\.)(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(url);
}

function isGoogleMapsHost(host: string): boolean {
  return /(^|\.)google\.[a-z.]+$/i.test(host) || /(^|\.)goo\.gl$/i.test(host);
}

/**
 * Reduce a Google Maps URL to the documented `?api=1&query=` form.
 *
 * Returns null when there's nothing in the URL a phone can act on — a bare
 * `cid`/`ftid`, or a short link we'd have to hit the network to expand. Callers
 * treat null as "use the address text instead", which is the better answer.
 *
 * Apple Maps links are left alone: they're already a native destination on the
 * device most of our guests are holding.
 */
export function normalizeMapLink(input: string): string | null {
  const raw = input.trim();
  if (!isMapLink(raw)) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (/(^|\.)maps\.apple\.com$/i.test(url.hostname)) return raw;
  if (!isGoogleMapsHost(url.hostname)) return null;
  if (isShortMapLink(raw)) return null;

  const query =
    url.searchParams.get("query") ||
    url.searchParams.get("q") ||
    url.searchParams.get("daddr") ||
    // /maps/place/Trial+Lake/@40.6,-111.0,15z — the path carries the name.
    decodeURIComponent(url.pathname.match(/\/maps\/place\/([^/@]+)/)?.[1] ?? "")
      .replace(/\+/g, " ")
      .trim();

  if (!query) return null;

  // A real Place ID (ChIJ…) pins the exact place; an ftid is not one, and
  // passing it through is what the Maps app chokes on.
  const placeId =
    url.searchParams.get("query_place_id") || url.searchParams.get("place_id");

  return mapsSearchUrl(query, placeId);
}

/**
 * Pick the best destination out of whatever the event has.
 *
 * Candidates are tried in the order the caller gave them — the caller knows
 * which of an exact address, a saved link and a general location is most
 * precise for the viewer. Each one is converted to a URL a phone can open;
 * anything that can't be converted is skipped rather than shipped broken.
 */
export function buildMapsUrl(
  ...candidates: (string | null | undefined)[]
): string | null {
  const values = candidates
    .map((c) => (typeof c === "string" ? c.trim() : ""))
    .filter(Boolean);

  for (const value of values) {
    if (isMapLink(value)) {
      const normalized = normalizeMapLink(value);
      if (normalized) return normalized;
    } else {
      return mapsSearchUrl(value);
    }
  }

  // Nothing reducible and no address text. A link that at least works on
  // desktop beats no link at all.
  return values.find(isMapLink) ?? null;
}

/**
 * What to print for an address. A pasted share link is unreadable as text, so
 * fall back to the human-entered location name when the address is just a URL.
 */
export function displayAddress(
  address?: string | null,
  fallback?: string | null
): string | null {
  const value = address?.trim();
  if (value && !isMapLink(value)) return value;
  return fallback?.trim() || null;
}
