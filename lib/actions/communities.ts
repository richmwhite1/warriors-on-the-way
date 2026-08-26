"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// in_person / online / hybrid. Anything unrecognised falls back to the column default
// rather than throwing — a bad value here should not cost someone their community.
function readFormat(formData: FormData): "in_person" | "online" | "hybrid" {
  const raw = formData.get("format") as string;
  return raw === "online" || raw === "hybrid" ? raw : "in_person";
}
import { slugExists } from "@/lib/queries/communities";
import { registerWebhook, sendMessage, detectNewGroupChatId } from "@/lib/integrations/telegram";

async function geocodeLocation(location: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "User-Agent": "WarriorsOnTheWay/1.0" }, signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return null;
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await slugExists(slug)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function createCommunity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  // Required one-sentence declaration — what stewards point at when a group drifts.
  const purpose = (formData.get("purpose") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const format = readFormat(formData);
  const is_private = formData.get("is_private") === "true";
  const members_can_create_events = formData.get("members_can_create_events") === "true";
  const custom_slug = (formData.get("slug") as string)?.trim();
  // ≥1 topic tag is how a community surfaces on the nine topic pages.
  const topicIds = (formData.getAll("topic_ids") as string[]).filter(Boolean);

  if (!name) throw new Error("Community name is required");
  if (!purpose) throw new Error("A one-sentence purpose is required");
  if (topicIds.length === 0) throw new Error("Pick at least one topic this community serves");

  const baseSlug = custom_slug ? toSlug(custom_slug) : toSlug(name);
  if (!baseSlug) throw new Error("Could not generate a valid slug from that name");

  const slug = await uniqueSlug(baseSlug);

  const coords = location ? await geocodeLocation(location) : null;

  // New communities start 'forming' (schema default): invite-link only, hidden from
  // browse until they reach five active members (enforced by trigger).
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .insert({
      slug, name, description, purpose, location, format, is_private, members_can_create_events,
      created_by: user.id,
      // Mint an invite link up front so the steward can recruit their first four
      // immediately — the token makes shared links one-tap-join, even when private.
      invite_token: crypto.randomUUID(),
      ...(coords ?? {}),
    })
    .select("id, slug")
    .single();

  if (communityError) throw new Error(communityError.message);

  // Creator becomes the owner (organizer role).
  const { error: memberError } = await supabase
    .from("community_members")
    .insert({ community_id: community.id, user_id: user.id, role: "organizer", status: "active" });

  if (memberError) throw new Error(memberError.message);

  // Tag the community to its topics (RLS allows this now that the creator is an active organizer).
  const { error: topicError } = await supabase
    .from("community_topics")
    .insert(topicIds.map((topic_id) => ({ community_id: community.id, topic_id })));
  if (topicError) throw new Error(topicError.message);

  // Doorway tags — how the circle surfaces on the menu. Optional: a private circle for
  // an existing group of friends has no reason to advertise itself on the front door.
  const needIds = (formData.getAll("need_ids") as string[]).filter(Boolean);
  if (needIds.length > 0) {
    const { error: needError } = await supabase
      .from("community_needs")
      .insert(needIds.map((need_id) => ({ community_id: community.id, need_id })));
    if (needError) throw new Error(needError.message);
    revalidatePath("/needs", "layout");
  }

  redirect(`/community/${community.slug}?created=1`);
}

export async function updateCommunitySettings(communityId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("communities")
    .select("is_parent")
    .eq("id", communityId)
    .single();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const format = readFormat(formData);
  const is_private = formData.get("is_private") === "true";
  const members_can_create_events = formData.get("members_can_create_events") === "true";
  const allow_guest_rsvp = formData.get("allow_guest_rsvp") === "true";
  const member_cap = existing?.is_parent
    ? null
    : Math.min(150, Math.max(1, parseInt(formData.get("member_cap") as string) || 150));
  const telegram_invite_link = (formData.get("telegram_invite_link") as string)?.trim() || null;
  const banner_url = (formData.get("banner_url") as string)?.trim() || null;
  const mission = (formData.get("mission") as string)?.trim() || null;
  const rules_md = (formData.get("rules_md") as string)?.trim() || null;
  const rawPushTypes = formData.getAll("telegram_push_types") as string[];
  const telegram_push_types = rawPushTypes.length > 0 ? rawPushTypes : ["discussion", "video", "music", "event"];

  if (!name) throw new Error("Community name is required");

  const coords = location ? await geocodeLocation(location) : null;

  const updateData: Record<string, unknown> = {
    name, description, location, format, is_private, members_can_create_events,
    allow_guest_rsvp, member_cap, telegram_invite_link, mission, rules_md, telegram_push_types,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
  };
  if (banner_url !== null) updateData.banner_url = banner_url;

  const { data: community, error } = await supabase
    .from("communities")
    .update(updateData)
    .eq("id", communityId)
    .select("slug")
    .single();

  if (error) throw new Error(error.message);

  // Re-sync doorway tags: the form posts the full set, so replace rather than merge —
  // unticking a doorway has to actually remove the circle from that page.
  const needIds = (formData.getAll("need_ids") as string[]).filter(Boolean);
  await supabase.from("community_needs").delete().eq("community_id", communityId);
  if (needIds.length > 0) {
    const { error: needError } = await supabase
      .from("community_needs")
      .insert(needIds.map((need_id) => ({ community_id: communityId, need_id })));
    if (needError) throw new Error(needError.message);
  }
  revalidatePath("/needs", "layout");

  revalidatePath(`/community/${community.slug}`);
  revalidatePath(`/community/${community.slug}/settings`);
}

/**
 * Registers the Telegram webhook with the Bot API so the app automatically
 * detects when the bot is added to a group. Should be called once per
 * deployment (or whenever the site URL changes).
 */
export async function setupTelegramWebhook(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!siteUrl.startsWith("https://")) {
    // Telegram requires HTTPS — skip registration in local dev.
    // The webhook will be registered automatically on first production deployment.
    return;
  }

  const result = await registerWebhook();
  if (!result.ok) {
    throw new Error(result.description ?? "Failed to register Telegram webhook");
  }
}

/**
 * Returns the Telegram chat ID for a community, or null if not connected.
 * Used by the settings form to poll for auto-connection after the bot is added.
 */
export async function checkTelegramConnected(communityId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }

  // telegram_chat_id is API-hidden — read via service role after the role check
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data } = await createAdminClient()
    .from("communities")
    .select("telegram_chat_id")
    .eq("id", communityId)
    .single();
  return (data as { telegram_chat_id?: string | null } | null)?.telegram_chat_id ?? null;
}

/**
 * Sends a test/welcome message to the connected Telegram group.
 * Called automatically when the webhook handler first connects a group,
 * but also available here for manual re-confirmation.
 */
export async function connectTelegramChannel(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }

  // 1. Check if the webhook already auto-connected the group (production path)
  // telegram_chat_id is API-hidden — read via service role (role check above)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { data: community } = await createAdminClient()
    .from("communities")
    .select("telegram_chat_id")
    .eq("id", communityId)
    .single();

  let chatId = (community as { telegram_chat_id?: string | null } | null)?.telegram_chat_id;

  // 2. Fallback: use getUpdates (works locally without HTTPS webhook)
  if (!chatId) {
    const result = await detectNewGroupChatId(communityId);
    if (!result) {
      throw new Error(
        "Bot not found in any Telegram group yet. Make sure you added it using the link above, then try again."
      );
    }
    chatId = result.chatId;
    await supabase
      .from("communities")
      .update({ telegram_chat_id: chatId })
      .eq("id", communityId);
  }

  // Send a confirmation message to the group
  await sendMessage(
    chatId,
    `✅ <b>WoW Assistant connected!</b>\n\nThis group is now linked to your Warriors on the Way community. New posts and events will automatically appear here.`
  );

  revalidatePath(`/community/${communitySlug}/settings`);
  revalidatePath(`/community/${communitySlug}`);
  return { chatId };
}

export async function refreshInviteToken(communityId: string, communitySlug: string): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }

  // Generate a new UUID token
  const token = crypto.randomUUID();
  await supabase
    .from("communities")
    .update({ invite_token: token })
    .eq("id", communityId);

  revalidatePath(`/community/${communitySlug}/settings`);
  return token;
}

export async function revokeInviteToken(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }

  await supabase
    .from("communities")
    .update({ invite_token: null })
    .eq("id", communityId);

  revalidatePath(`/community/${communitySlug}/settings`);
}

export async function disconnectTelegramChannel(communityId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: membership } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();
  if (!membership || !["admin", "organizer"].includes(membership.role as string)) {
    throw new Error("Not authorized");
  }

  await supabase
    .from("communities")
    .update({ telegram_chat_id: null })
    .eq("id", communityId);

  revalidatePath(`/community/${communitySlug}/settings`);
}
