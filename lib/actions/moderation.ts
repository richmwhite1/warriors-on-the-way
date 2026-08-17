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
// sees what was removed and why (hidden_reason).
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
  revalidatePath(`/community/${communitySlug}`);
  revalidatePath(`/community/${communitySlug}/asks`);
}
