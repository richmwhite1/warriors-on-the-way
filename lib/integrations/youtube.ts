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
