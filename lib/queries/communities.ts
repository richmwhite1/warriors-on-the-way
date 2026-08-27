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
  // How the circle actually meets — what the doorway filters narrow on.
  format?: "in_person" | "online" | "hybrid" | null;
};

// Every column except invite_token / telegram_chat_id, which are revoked from
// the anon/authenticated API roles — select("*") would fail with a permission
// error. Read those via getCommunityAdminSecrets() after verifying the caller.
const COMMUNITY_SELECT = `
  id, slug, name, description, banner_url, is_parent, is_private,
  members_can_create_events, member_cap, created_by, created_at, updated_at,
  allow_guest_rsvp, location, telegram_invite_link, telegram_push_types,
  mission, rules_md, latitude, longitude, public_member_count, format
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

export async function listPublicCommunities() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select(`
      id, slug, name, description, banner_url, is_parent,
      is_private, member_cap, created_at, latitude, longitude,
      public_member_count, status,
      post_count:posts(count),
      community_topics(topic:topics!topic_id(slug, name))
    `)
    .eq("is_private", false)
    // Forming circles are browsable, not hidden. Holding them back until the fifth
    // member was the engine of the ghost town: a founder started a circle, the network
    // still reported itself empty — to them and to the very people who could have been
    // members two, three and four. The threshold meant to protect quality was what kept
    // anything from reaching it. They surface with their real state on the card
    // ("Forming — 3 of 5") so the honesty is kept and the invitation is legible.
    // Dormant (forming + 30 days + still under five) stays hidden, as designed.
    .or("status.eq.listed,status.eq.forming,is_parent.eq.true")
    .is("posts.deleted_at", null)
    .order("created_at", { ascending: false });
  // Normalise to member_count + a flat topics array so the client can filter by The Nine.
  return (data ?? []).map((c) => {
    const raw = c as Record<string, unknown>;
    const links = (raw.community_topics as { topic: { slug: string; name: string } | null }[] | null) ?? [];
    const topics = links.map((l) => l.topic).filter((t): t is { slug: string; name: string } => !!t);
    return {
      ...c,
      member_count: raw.public_member_count ?? 0,
      topics,
    };
  });
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
    status?: "forming" | "listed" | "dormant";
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
        is_private, member_cap, created_at, status
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
