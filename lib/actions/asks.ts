"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";

// Create an ask ("I need…") or offer ("I can…"). Requires community membership.
export async function createAsk(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  const slug = formData.get("community_slug") as string;
  const kind = (formData.get("kind") as string) === "offer" ? "offer" : "ask";
  const title = ((formData.get("title") as string) ?? "").trim();
  const body = ((formData.get("body") as string) ?? "").trim() || null;
  const topic_id = (formData.get("topic_id") as string) || null;

  if (!community_id) throw new Error("Community is required");
  if (!title) throw new Error("A short title is required");

  const { error } = await supabase.from("asks").insert({
    community_id, author_id: user.id, kind, title, body, topic_id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${slug}/asks`);
}

// Someone claims an open ask (offers to fulfil it / takes up an offer).
export async function claimAsk(askId: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("asks")
    .update({ status: "claimed", claimed_by: user.id })
    .eq("id", askId)
    .eq("status", "open"); // guard against races
  if (error) throw new Error(error.message);

  // Notify the author that someone stepped up.
  try {
    const admin = createAdminClient();
    const { data: ask } = await admin.from("asks").select("author_id, title").eq("id", askId).single();
    const { data: claimer } = await admin.from("users").select("display_name").eq("id", user.id).single();
    if (ask && ask.author_id !== user.id) {
      await createNotification(ask.author_id, "member_joined", {
        actor_name: (claimer as { display_name?: string } | null)?.display_name ?? "Someone",
        ask_id: askId, community_slug: slug, kind: "ask_claimed",
      });
    }
  } catch { /* best-effort */ }

  revalidatePath(`/community/${slug}/asks`);
}

// Author or claimer backs out — return the ask to open.
export async function unclaimAsk(askId: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("asks")
    .update({ status: "open", claimed_by: null })
    .eq("id", askId)
    .eq("status", "claimed");
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${slug}/asks`);
}

// The author confirms fulfilment and leaves a thank-you. Terminal state; this is
// what makes the ask show on the fulfiller's profile as reputation.
export async function fulfillAsk(askId: string, slug: string, thankYou: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("asks")
    .update({ status: "fulfilled", thanked_at: new Date().toISOString(), thank_you_note: thankYou.trim() || null })
    .eq("id", askId)
    .eq("author_id", user.id) // only the author confirms fulfilment
    .eq("status", "claimed");
  if (error) throw new Error(error.message);

  try {
    const admin = createAdminClient();
    const { data: ask } = await admin.from("asks").select("claimed_by, title").eq("id", askId).single();
    if (ask?.claimed_by) {
      await createNotification(ask.claimed_by, "member_joined", {
        ask_id: askId, community_slug: slug, kind: "ask_fulfilled", ask_title: ask.title,
      });
    }
  } catch { /* best-effort */ }

  revalidatePath(`/community/${slug}/asks`);
}

// Coordination happens on the ask thread — not DMs.
export async function addAskComment(askId: string, body: string, slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");
  const { error } = await supabase.from("ask_comments").insert({
    ask_id: askId, author_id: user.id, body: trimmed,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${slug}/asks`);
}

export async function reportAsk(askId: string, communityId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id, target_type: "ask", target_id: askId,
    community_id: communityId, reason,
  });
  if (error) throw new Error(error.message);
}
