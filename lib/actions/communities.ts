"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugExists } from "@/lib/queries/communities";
import { registerWebhook, sendMessage } from "@/lib/integrations/telegram";

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
  const is_private = formData.get("is_private") === "true";
  const members_can_create_events = formData.get("members_can_create_events") === "true";
  const custom_slug = (formData.get("slug") as string)?.trim();

  if (!name) throw new Error("Community name is required");

  const baseSlug = custom_slug ? toSlug(custom_slug) : toSlug(name);
  if (!baseSlug) throw new Error("Could not generate a valid slug from that name");

  const slug = await uniqueSlug(baseSlug);

  // Insert community + membership in a transaction via RPC
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .insert({ slug, name, description, is_private, members_can_create_events, created_by: user.id })
    .select("id, slug")
    .single();

  if (communityError) throw new Error(communityError.message);

  const { error: memberError } = await supabase
    .from("community_members")
    .insert({ community_id: community.id, user_id: user.id, role: "organizer", status: "active" });

  if (memberError) throw new Error(memberError.message);

  redirect(`/community/${community.slug}`);
}

export async function updateCommunitySettings(communityId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const is_private = formData.get("is_private") === "true";
  const members_can_create_events = formData.get("members_can_create_events") === "true";
  const allow_guest_rsvp = formData.get("allow_guest_rsvp") === "true";
  const member_cap = Math.min(150, Math.max(1, parseInt(formData.get("member_cap") as string) || 150));
  const telegram_invite_link = (formData.get("telegram_invite_link") as string)?.trim() || null;
  const banner_url = (formData.get("banner_url") as string)?.trim() || null;
  const mission = (formData.get("mission") as string)?.trim() || null;
  const rules_md = (formData.get("rules_md") as string)?.trim() || null;

  if (!name) throw new Error("Community name is required");

  const updateData: Record<string, unknown> = { name, description, location, is_private, members_can_create_events, allow_guest_rsvp, member_cap, telegram_invite_link, mission, rules_md };
  if (banner_url !== null) updateData.banner_url = banner_url;

  const { data: community, error } = await supabase
    .from("communities")
    .update(updateData)
    .eq("id", communityId)
    .select("slug")
    .single();

  if (error) throw new Error(error.message);
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
  const { data } = await supabase
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

  // Check if the webhook already auto-connected the group
  const { data: community } = await supabase
    .from("communities")
    .select("telegram_chat_id")
    .eq("id", communityId)
    .single();

  const chatId = (community as { telegram_chat_id?: string | null } | null)?.telegram_chat_id;
  if (!chatId) {
    throw new Error(
      "Not connected yet. Make sure you added the bot to your Telegram group using the link above, then wait a moment and try again."
    );
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
