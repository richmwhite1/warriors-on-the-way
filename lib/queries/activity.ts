import { createClient } from "@/lib/supabase/server";

export type RemovalNotice = {
  community_id: string;
  removed_at: string;
  community: { name: string; slug: string; public_member_count: number; member_cap: number } | null;
};

// Unacknowledged inactivity removals for the current user — powers the kind
// "here's what happened, rejoin in one tap" notice on next login.
export async function getUnacknowledgedRemovals(userId: string): Promise<RemovalNotice[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("inactivity_removals")
    .select("community_id, removed_at, community:communities!community_id(name, slug, public_member_count, member_cap)")
    .eq("user_id", userId)
    .is("acknowledged_at", null)
    .order("removed_at", { ascending: false });
  return (data as unknown as RemovalNotice[]) ?? [];
}
