// Embed URL detection and normalization.
// Add new platforms by adding a case here — nothing else changes.

export type EmbedMeta = {
  type: "video" | "music";
  embedUrl: string;
  thumbnailUrl: string | null;
};

export function getEmbedMeta(rawUrl: string): EmbedMeta | null {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube — watch URLs, short URLs, Shorts
    if (host === "youtube.com" || host === "youtu.be") {
      let videoId: string | null = null;
      if (host === "youtu.be") {
        videoId = u.pathname.slice(1).split("?")[0];
      } else if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1]?.split("?")[0] ?? null;
      } else {
        videoId = u.searchParams.get("v");
      }
      if (!videoId) return null;
      return {
        type: "video",
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }

    // Spotify — track, album, playlist, episode, show
    if (host === "open.spotify.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const [spotifyType, spotifyId] = parts;
        return {
          type: "music",
          embedUrl: `https://open.spotify.com/embed/${spotifyType}/${spotifyId}?utm_source=generator`,
          thumbnailUrl: null,
        };
      }
      return null;
    }

    // Vimeo — vimeo.com/{id} and vimeo.com/{id}/{hash} (unlisted videos)
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const idIndex = parts[0] === "video" ? 1 : 0;
      const videoId = parts[idIndex];
      if (!videoId || !/^\d+$/.test(videoId)) return null;
      const hash = parts[idIndex + 1];
      const embedUrl = hash
        ? `https://player.vimeo.com/video/${videoId}?h=${hash}`
        : `https://player.vimeo.com/video/${videoId}`;
      return { type: "video", embedUrl, thumbnailUrl: null };
    }

    // SoundCloud — tracks, sets, user profiles
    if (host === "soundcloud.com" || host === "m.soundcloud.com") {
      const canonical = `https://soundcloud.com${u.pathname}`;
      return {
        type: "music",
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(canonical)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
        thumbnailUrl: null,
      };
    }

    // Apple Podcasts — just swap the host to the embed subdomain
    if (host === "podcasts.apple.com") {
      return {
        type: "music",
        embedUrl: `https://embed.podcasts.apple.com${u.pathname}${u.search}`,
        thumbnailUrl: null,
      };
    }

    return null;
  } catch {
    return null;
  }
}
