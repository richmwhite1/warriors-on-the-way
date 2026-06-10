export type YouTubeOEmbed = {
  title: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  html: string;
  author_name: string;
  video_id: string;
};

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchYouTubeOEmbed(url: string): Promise<YouTubeOEmbed | null> {
  const id = extractYouTubeId(url);
  if (!id) return null;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { ...data, video_id: id };
  } catch {
    return null;
  }
}

export function YouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Seán's YouTube channel — the live source for "latest from Seán" surfaces
export const SEAN_YOUTUBE_CHANNEL_ID = "UCSEABr_YYaS6MLSAXE6Tuzw";

export type LatestVideo = { videoId: string; title: string; published: string | null };

export async function fetchLatestChannelVideo(
  channelId: string = SEAN_YOUTUBE_CHANNEL_ID
): Promise<LatestVideo | null> {
  if (!channelId) return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } } // re-fetch at most once per hour
    );
    if (!res.ok) return null;
    const xml = await res.text();
    // First <entry> is the most recent upload
    const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/)?.[1];
    if (!entry) return null;
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    if (!videoId) return null;
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "Latest transmission";
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? null;
    return { videoId, title, published };
  } catch {
    return null;
  }
}
