import { createClient } from "@/lib/supabase/server";

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  is_parent: boolean;
  is_private: boolean;
  members_can_create_events: boolean;
  member_cap: number;
  created_by: string;
  created_at: string;
  member_count?: number;
  // Phase 4 Telegram integration fields (optional until migration runs)
  telegram_chat_id?: string | null;
  telegram_invite_link?: string | null;
  location?: string | null;
};

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();
  return data;
}

export async function getCommunityWithMemberCount(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select(`
      *,
      member_count:community_members(count)
    `)
    .eq("slug", slug)
    .eq("community_members.status", "active")
    .single();
  return data;
}

export async function listPublicCommunities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select(`
      id, slug, name, description, banner_url, is_parent,
      is_private, member_cap, created_at,
      member_count:community_members(count)
    `)
    .eq("is_private", false)
    .eq("community_members.status", "active")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export type UserMembership = {
  role: "member" | "admin" | "organizer";
  status: string;
  joined_at: string;
  community: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    banner_url: string | null;
    is_parent: boolean;
    is_private: boolean;
    member_cap: number;
    created_at: string;
  };
};

export async function listUserCommunities(userId: string): Promise<UserMembership[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select(`
      role, status, joined_at,
      community:communities!inner(
        id, slug, name, description, banner_url, is_parent,
        is_private, member_cap, created_at
      )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any) ?? [];
}

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  return (count ?? 0) > 0;
}
