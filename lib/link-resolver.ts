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

async function fetchText(url: string, timeoutMs = 5000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "WarriotsOnTheWay/1.0 (+link-preview)" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function resolveLink(rawUrl: string): Promise<LinkPreview | null> {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
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
