import { createClient } from "@/lib/supabase/server";

export type Membership = {
  id: string;
  community_id: string;
  user_id: string;
  role: "member" | "admin" | "organizer";
  status: "active" | "waitlisted" | "pending_approval" | "banned";
  joined_at: string;
};

export type MemberWithProfile = {
  id: string;
  role: "member" | "admin" | "organizer";
  status: string;
  joined_at: string;
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    venmo_handle: string | null;
  };
};

export async function getMembership(
  communityId: string,
  userId: string
): Promise<Membership | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function listActiveMembers(communityId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select(`
      id, role, status, joined_at,
      user:users(id, display_name, avatar_url, venmo_handle)
    `)
    .eq("community_id", communityId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });
  return (data as unknown as MemberWithProfile[]) ?? [];
}

export async function listWaitlistedMembers(communityId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select(`
      id, role, status, joined_at,
      user:users(id, display_name, avatar_url, venmo_handle)
    `)
    .eq("community_id", communityId)
    .in("status", ["waitlisted", "pending_approval"])
    .order("joined_at", { ascending: true });
  return (data as unknown as MemberWithProfile[]) ?? [];
}

export async function getActiveMemberCount(communityId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("community_members")
    .select("id", { count: "exact", head: true })
    .eq("community_id", communityId)
    .eq("status", "active");
  return count ?? 0;
}
