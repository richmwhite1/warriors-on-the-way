import { createClient } from "@/lib/supabase/server";

export type TopicResource = {
  id: string;
  topic_id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: string;
  url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  vouch_count: number;
  vouched_by_me: boolean;
  distance_km: number | null;
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// The Resources directory for a topic: a filtered directory (NOT a feed), sorted by
// proximity when the viewer's location is known, then by vouches. Optional category filter.
export async function listTopicResources(
  topicId: string,
  userId: string,
  opts?: { category?: string; lat?: number; lng?: number }
): Promise<TopicResource[]> {
  const supabase = await createClient();
  let q = supabase
    .from("topic_resources")
    .select("id, topic_id, created_by, title, description, category, url, address, latitude, longitude, created_at, vouches:resource_vouches(user_id)")
    .eq("topic_id", topicId)
    .is("hidden_at", null);
  if (opts?.category) q = q.eq("category", opts.category);
  const { data } = await q;

  const rows = ((data ?? []) as unknown as (Omit<TopicResource, "vouch_count" | "vouched_by_me" | "distance_km"> & { vouches: { user_id: string }[] })[])
    .map((r) => {
      const vouches = r.vouches ?? [];
      const distance_km = (opts?.lat != null && opts?.lng != null && r.latitude != null && r.longitude != null)
        ? haversineKm(opts.lat, opts.lng, r.latitude, r.longitude)
        : null;
      return {
        ...r,
        vouch_count: vouches.length,
        vouched_by_me: vouches.some((v) => v.user_id === userId),
        distance_km,
      };
    });

  // Sort: nearest first when we have distances, else most-vouched first.
  rows.sort((a, b) => {
    if (a.distance_km != null && b.distance_km != null) return a.distance_km - b.distance_km;
    if (a.distance_km != null) return -1;
    if (b.distance_km != null) return 1;
    return b.vouch_count - a.vouch_count;
  });
  return rows as TopicResource[];
}
