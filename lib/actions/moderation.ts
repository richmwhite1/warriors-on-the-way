"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type FlagTarget = "post" | "comment" | "ask";

// Flagging is anonymous to the accused (reporter_id is never exposed to them — RLS
// restricts report reads to stewards/parent admins). Distinct flags reaching the
// community's flag_threshold auto-hide the content (DB trigger).
export async function flagContent(
  targetType: FlagTarget,
  targetId: string,
  communityId: string | null,
  reason: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    community_id: communityId,
    reason: reason.trim() || "Flagged",
  });
  // Ignore duplicate-flag unique-violation: a person can only flag once.
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

// A lone steward can HIDE (reversible) but never permanently delete. The accused
// sees what was removed and why (hidden_reason). Unhiding resolves open flags.
export async function stewardSetHidden(
  targetType: FlagTarget,
  targetId: string,
  communitySlug: string,
  hidden: boolean,
  reason?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const table = targetType === "post" ? "posts" : targetType === "comment" ? "comments" : "asks";
  const { error } = await supabase
    .from(table)
    .update({
      hidden_at: hidden ? new Date().toISOString() : null,
      hidden_reason: hidden ? (reason?.trim() || "Hidden by a steward") : null,
    })
    .eq("id", targetId);
  if (error) throw new Error(error.message);

  // When restoring content, mark its open flags resolved (kept).
  if (!hidden) {
    await supabase.from("reports")
      .update({ status: "dismissed", resolution_note: "Restored by steward" })
      .eq("target_type", targetType).eq("target_id", targetId).eq("status", "open");
  } else {
    await supabase.from("reports")
      .update({ status: "actioned", resolution_note: "Hidden by steward" })
      .eq("target_type", targetType).eq("target_id", targetId).eq("status", "open");
  }

  revalidatePath(`/community/${communitySlug}`);
  revalidatePath(`/community/${communitySlug}/asks`);
  revalidatePath(`/community/${communitySlug}/moderation`);
}

// Topic reviewer variant — reversible hide of a topic-scoped post.
export async function reviewerSetHidden(
  postId: string,
  topicSlug: string,
  hidden: boolean,
  reason?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("posts")
    .update({
      hidden_at: hidden ? new Date().toISOString() : null,
      hidden_reason: hidden ? (reason?.trim() || "Hidden by a topic reviewer") : null,
    })
    .eq("id", postId);
  if (error) throw new Error(error.message);

  await supabase.from("reports")
    .update({ status: hidden ? "actioned" : "dismissed",
              resolution_note: hidden ? "Hidden by reviewer" : "Restored by reviewer" })
    .eq("target_type", "post").eq("target_id", postId).eq("status", "open");

  revalidatePath(`/topics/${topicSlug}`);
  revalidatePath(`/topics/${topicSlug}/review`);
}
