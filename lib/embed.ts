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
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
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

    return null;
  } catch {
    return null;
  }
}
