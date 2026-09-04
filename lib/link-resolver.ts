// Server-side link resolution for the single "paste anything" posting field.
// A pasted URL becomes an embed (YouTube/Rumble/Spotify/podcast) or a generic
// link-preview card. Typed text (no URL) stays a plain discussion post upstream.

import { getEmbedMeta } from "@/lib/embed";

export type LinkPreview = {
  provider: string;          // youtube|rumble|spotify|vimeo|soundcloud|podcast|link
  embedUrl: string | null;   // iframe src when embeddable
  thumbnailUrl: string | null;
  title: string | null;
  description: string | null;
  url: string;
};

// Pull the first http(s) URL out of arbitrary text.
export function extractFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s<>"']+/i);
  return m ? m[0].replace(/[.,)]+$/, "") : null;
}

function metaTag(html: string, prop: string): string | null {
  // Match <meta property="og:x" content="..."> or name="x" in any attribute order.
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
}

/**
 * A pasted link is fetched by our server, so an unrestricted fetch is a request
 * forgery primitive: someone posts `http://169.254.169.254/…` or a localhost URL
 * and the page's own og: tags come back rendered in their post card. Public
 * http(s) hosts only, and no redirect may land on a private address either.
 */
const BLOCKED_HOST = /^(localhost|.*\.local|.*\.internal)$/i;

function isPrivateAddress(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOST.test(host)) return true;

  // IPv6 loopback / link-local / unique-local.
  if (host === "::1" || host.startsWith("fe80:") || /^f[cd][0-9a-f]{2}:/.test(host)) return true;

  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!v4) return false;
  const [a, b] = v4.slice(1).map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) || // cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127)
  );
}

export function isFetchableUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return (u.protocol === "http:" || u.protocol === "https:") && !isPrivateAddress(u.hostname);
  } catch {
    return false;
  }
}

async function fetchText(url: string, timeoutMs = 5000): Promise<string | null> {
  if (!isFetchableUrl(url)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "WarriorsOnTheWay/1.0 (+link-preview)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    // A redirect can walk out of the public internet after the initial check.
    if (!isFetchableUrl(res.url)) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function resolveLink(rawUrl: string): Promise<LinkPreview | null> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  if (!isFetchableUrl(rawUrl)) return null;
  const host = url.hostname.replace(/^www\./, "");

  // 1) Known iframe-embeddable providers (pure, synchronous).
  const embed = getEmbedMeta(rawUrl);
  if (embed) {
    return {
      provider: embed.provider,
      embedUrl: embed.embedUrl,
      thumbnailUrl: embed.thumbnailUrl,
      title: null,
      description: null,
      url: rawUrl,
    };
  }

  // 2) Rumble — resolve the embed via its oEmbed endpoint (slug != embed id).
  if (host === "rumble.com") {
    const oembed = await fetchText(
      `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(rawUrl)}`
    );
    if (oembed) {
      try {
        const j = JSON.parse(oembed) as { html?: string; thumbnail_url?: string; title?: string };
        const src = j.html?.match(/src=["']([^"']+)["']/i)?.[1] ?? null;
        return {
          provider: "rumble",
          embedUrl: src,
          thumbnailUrl: j.thumbnail_url ?? null,
          title: j.title ?? null,
          description: null,
          url: rawUrl,
        };
      } catch { /* fall through to OG */ }
    }
  }

  // 3) Generic OpenGraph / link preview.
  const html = await fetchText(rawUrl);
  if (!html) {
    return { provider: "link", embedUrl: null, thumbnailUrl: null, title: null, description: null, url: rawUrl };
  }
  return {
    provider: "link",
    embedUrl: null,
    thumbnailUrl: metaTag(html, "og:image"),
    title: metaTag(html, "og:title")
      ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null,
    description: metaTag(html, "og:description") ?? metaTag(html, "description"),
    url: rawUrl,
  };
}
