"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "User-Agent": "WarriorsOnTheWay/1.0" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

export async function createTopicResource(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const topic_id = formData.get("topic_id") as string;
  const topic_slug = formData.get("topic_slug") as string;
  const title = ((formData.get("title") as string) ?? "").trim();
  const description = ((formData.get("description") as string) ?? "").trim() || null;
  const category = (formData.get("category") as string) || "other";
  const url = ((formData.get("url") as string) ?? "").trim() || null;
  const address = ((formData.get("address") as string) ?? "").trim() || null;

  if (!topic_id) throw new Error("Topic is required");
  if (!title) throw new Error("A title is required");

  const coords = address ? await geocode(address) : null;

  const { error } = await supabase.from("topic_resources").insert({
    topic_id, created_by: user.id, title, description, category, url, address,
    latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/topics/${topic_slug}/resources`);
}

// A vouch is a lightweight trust signal used for directory sorting.
export async function toggleVouch(resourceId: string, topicSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("resource_vouches")
    .select("resource_id")
    .eq("resource_id", resourceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("resource_vouches").delete()
      .eq("resource_id", resourceId).eq("user_id", user.id);
  } else {
    await supabase.from("resource_vouches").insert({ resource_id: resourceId, user_id: user.id });
  }
  revalidatePath(`/topics/${topicSlug}/resources`);
}
