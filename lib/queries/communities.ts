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

// Every column except invite_token / telegram_chat_id, which are revoked from
// the anon/authenticated API roles — select("*") would fail with a permission
// error. Read those via getCommunityAdminSecrets() after verifying the caller.
const COMMUNITY_SELECT = `
  id, slug, name, description, banner_url, is_parent, is_private,
  members_can_create_events, member_cap, created_by, created_at, updated_at,
  allow_guest_rsvp, location, telegram_invite_link, telegram_push_types,
  mission, rules_md, latitude, longitude, public_member_count
`;

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select(COMMUNITY_SELECT)
    .eq("slug", slug)
    .single();
  return data as Community | null;
}

export async function getCommunityWithMemberCount(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select(`
      ${COMMUNITY_SELECT},
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
    .select(COMMUNITY_SELECT)
    .eq("is_parent", true)
    .single();
  return data as Community | null;
}

/**
 * Admin-only secrets (invite token, Telegram chat id) — these columns are not
 * readable through the user-facing API roles. Callers MUST verify the user is
 * an admin/organizer of the community before calling this.
 */
export async function getCommunityAdminSecrets(
  communityId: string
): Promise<{ invite_token: string | null; telegram_chat_id: string | null }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("communities")
    .select("invite_token, telegram_chat_id")
    .eq("id", communityId)
    .single();
  return {
    invite_token: (data as { invite_token?: string | null } | null)?.invite_token ?? null,
    telegram_chat_id: (data as { telegram_chat_id?: string | null } | null)?.telegram_chat_id ?? null,
  };
}

/**
 * Fetch a community by slug using the admin client — bypasses RLS.
 * Used for guest/public pages where the viewer is not authenticated.
 */
export async function getCommunityBySlugPublic(slug: string): Promise<Community | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("communities")
    .select(COMMUNITY_SELECT)
    .eq("slug", slug)
    .single();
  return data as Community | null;
}

export async function slugExists(slug: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  return (count ?? 0) > 0;
}
