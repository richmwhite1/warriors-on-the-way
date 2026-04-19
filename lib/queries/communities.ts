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
  member_cap: number | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  // Phase 4 Telegram integration fields (optional until migration runs)
  telegram_chat_id?: string | null;
  telegram_invite_link?: string | null;
  location?: string | null;
  // Guest access (optional until migration runs, defaults to true)
  allow_guest_rsvp?: boolean;
  // About page content
  mission?: string | null;
  rules_md?: string | null;
  // Per-community Telegram push type filter
  telegram_push_types?: string[] | null;
  // Geocoded coordinates for proximity search
  latitude?: number | null;
  longitude?: number | null;
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
      is_private, member_cap, created_at, latitude, longitude,
      public_member_count,
      post_count:posts(count)
    `)
    .eq("is_private", false)
    .is("posts.deleted_at", null)
    .order("created_at", { ascending: false });
  // Normalise to member_count so CommunityCard receives a consistent prop
  return (data ?? []).map((c) => ({
    ...c,
    member_count: (c as Record<string, unknown>).public_member_count ?? 0,
  }));
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
    member_cap: number | null;
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

export async function getParentCommunity(): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("*")
    .eq("is_parent", true)
    .single();
  return data;
}

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  return (count ?? 0) > 0;
}
