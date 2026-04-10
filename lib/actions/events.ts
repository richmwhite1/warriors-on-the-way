"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventNotification } from "@/lib/integrations/telegram";
import { notifyCommunityMembers } from "@/lib/actions/notifications";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const virtual_url = (formData.get("virtual_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const mode = formData.get("mode") as string; // "confirmed" | "voting"
  const vote_threshold = parseInt(formData.get("vote_threshold") as string) || 75;

  if (!title) throw new Error("Title is required");

  let starts_at: string | null = null;
  let ends_at: string | null = null;
  let status: "confirmed" | "voting" = "confirmed";

  if (mode === "voting") {
    status = "voting";
  } else {
    const dateStr = formData.get("starts_at") as string;
    const endsStr = formData.get("ends_at") as string;
    if (dateStr) starts_at = new Date(dateStr).toISOString();
    if (endsStr) ends_at = new Date(endsStr).toISOString();
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({ community_id, created_by: user.id, title, description, location, virtual_url, image_url, timezone, starts_at, ends_at, status, vote_threshold })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // Add voting date options if provided
  if (mode === "voting") {
    const optionDates = (formData.getAll("option_starts_at") as string[]).filter(Boolean);
    const optionEnds = (formData.getAll("option_ends_at") as string[]);
    if (optionDates.length > 0) {
      await supabase.from("event_date_options").insert(
        optionDates.map((d, i) => ({
          event_id: event.id,
          starts_at: new Date(d).toISOString(),
          ends_at: optionEnds[i] ? new Date(optionEnds[i]).toISOString() : null,
        }))
      );
    }
  }

  // Get community slug + Telegram chat ID for redirect + notification
  const admin = createAdminClient();
  const { data: community } = await admin
    .from("communities")
    .select("slug, name, telegram_chat_id")
    .eq("id", community_id)
    .single();

  const communityData = community as {
    slug: string;
    name: string;
    telegram_chat_id?: string | null;
  } | null;

  // ── Telegram notification ────────────────────────────────────────────────
  if (communityData?.telegram_chat_id) {
    await sendEventNotification(communityData.telegram_chat_id, {
      communityName: communityData.name,
      communitySlug: communityData.slug,
      eventId: event.id,
      title,
      location,
      startsAt: starts_at,
      timezone,
    }).catch(() => {
      // Don't block redirect if Telegram is unreachable
    });
  }
  // ── In-app notifications ─────────────────────────────────────────────────
  if (communityData) {
    await notifyCommunityMembers(community_id, "event_created", {
      event_id: event.id,
      title,
      community_slug: communityData.slug,
      community_name: communityData.name,
    }, user.id);
  }
  // ────────────────────────────────────────────────────────────────────────

  redirect(`/community/${communityData?.slug}/events/${event.id}`);
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const virtual_url = (formData.get("virtual_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const dateStr = formData.get("starts_at") as string;
  const endsStr = formData.get("ends_at") as string;
  const starts_at = dateStr ? new Date(dateStr).toISOString() : null;
  const ends_at = endsStr ? new Date(endsStr).toISOString() : null;

  const { data: event, error } = await supabase
    .from("events")
    .update({ title, description, location, virtual_url, image_url, starts_at, ends_at })
    .eq("id", eventId)
    .select("community_id")
    .single();

  if (error) throw new Error(error.message);

  const { data: community } = await supabase
    .from("communities").select("slug").eq("id", event.community_id).single();

  revalidatePath(`/community/${community?.slug}/events/${eventId}`);
}

export async function cancelEvent(eventId: string, communitySlug: string) {
  const supabase = await createClient();
  await supabase.from("events").update({ status: "cancelled" }).eq("id", eventId);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
  revalidatePath(`/community/${communitySlug}/events`);
}

export async function lockEventToDate(eventId: string, optionId: string, communitySlug: string) {
  const supabase = await createClient();

  const { data: option } = await supabase
    .from("event_date_options")
    .select("starts_at, ends_at")
    .eq("id", optionId)
    .single();

  if (!option) throw new Error("Option not found");

  await supabase.from("events").update({
    status: "confirmed",
    starts_at: option.starts_at,
    ends_at: option.ends_at,
  }).eq("id", eventId);

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}
