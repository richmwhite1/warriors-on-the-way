"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertRsvp(
  eventId: string,
  status: "yes" | "no" | "maybe",
  guests: number,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("rsvps").upsert(
    { event_id: eventId, user_id: user.id, status, guests },
    { onConflict: "event_id,user_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function castDateVote(
  optionId: string,
  eventId: string,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("event_date_votes").upsert(
    { option_id: optionId, user_id: user.id },
    { onConflict: "option_id,user_id" }
  );

  // Check if threshold reached — auto-lock
  const { data: event } = await supabase
    .from("events")
    .select("vote_threshold, community_id")
    .eq("id", eventId)
    .single();

  if (event) {
    const { count: memberCount } = await supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("community_id", event.community_id)
      .eq("status", "active");

    const { count: voteCount } = await supabase
      .from("event_date_votes")
      .select("id", { count: "exact", head: true })
      .eq("option_id", optionId);

    const pct = memberCount && memberCount > 0
      ? Math.round(((voteCount ?? 0) / memberCount) * 100)
      : 0;

    if (pct >= event.vote_threshold) {
      await supabase.from("events").update({
        status: "confirmed",
        starts_at: (await supabase
          .from("event_date_options")
          .select("starts_at, ends_at")
          .eq("id", optionId)
          .single()
        ).data?.starts_at,
      }).eq("id", eventId);
    }
  }

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function removeDateVote(
  optionId: string,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("event_date_votes")
    .delete()
    .eq("option_id", optionId)
    .eq("user_id", user.id);

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}
