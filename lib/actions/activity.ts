"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Bump the weighted activity clock for a membership. Call ONLY from meaningful
// actions (RSVP/attend, post, comment, create event, post/answer an ask) — never
// from likes or reads. Clears any pending 5-month warning. Best-effort.
export async function touchMembership(communityId: string, userId?: string) {
  if (!communityId) return;
  const supabase = await createClient();
  let uid = userId;
  if (!uid) {
    const { data: { user } } = await supabase.auth.getUser();
    uid = user?.id;
  }
  if (!uid) return;
  await supabase
    .from("community_members")
    .update({ last_meaningful_action_at: new Date().toISOString(), warned_at: null })
    .eq("community_id", communityId)
    .eq("user_id", uid);
}

// The "still here" tap from the 5-month warning: keep the seat.
export async function stillHere(communityId: string) {
  await touchMembership(communityId);
  revalidatePath("/home");
}

// Rejoin a community you were removed from for inactivity (if there is room).
// Removal is never a ban, so this is a one-tap restore.
export async function rejoinCommunity(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, user_id: user.id, role: "member", status: "active" });
  // The 150-cap trigger raises if full — surface that plainly.
  if (error) {
    if (error.message.includes("member cap")) throw new Error("This community is full right now.");
    throw new Error(error.message);
  }

  await supabase
    .from("inactivity_removals")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("community_id", communityId);

  revalidatePath("/home");
}

// Dismiss the removal notice without rejoining.
export async function acknowledgeRemoval(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("inactivity_removals")
    .update({ acknowledged_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("community_id", communityId);
  revalidatePath("/home");
}
