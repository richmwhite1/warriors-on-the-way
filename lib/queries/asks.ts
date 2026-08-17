import { createClient } from "@/lib/supabase/server";

export type AskStatus = "open" | "claimed" | "fulfilled";
export type AskKind = "ask" | "offer";

export type Ask = {
  id: string;
  community_id: string;
  author_id: string;
  kind: AskKind;
  title: string;
  body: string | null;
  topic_id: string | null;
  status: AskStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  fulfilled_at: string | null;
  thanked_at: string | null;
  thank_you_note: string | null;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null };
  claimer: { id: string; display_name: string } | null;
  topic: { name: string; slug: string } | null;
  community?: { slug: string; name: string } | null;
};

const ASK_SELECT = `
  id, community_id, author_id, kind, title, body, topic_id, status,
  claimed_by, claimed_at, fulfilled_at, thanked_at, thank_you_note, created_at,
  author:users!author_id(id, display_name, avatar_url),
  claimer:users!claimed_by(id, display_name),
  topic:topics!topic_id(name, slug),
  community:communities!community_id(slug, name)
`;

export async function listCommunityAsks(communityId: string): Promise<Ask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("asks")
    .select(ASK_SELECT)
    .eq("community_id", communityId)
    .order("status", { ascending: true }) // claimed < fulfilled < open alphabetically…
    .order("created_at", { ascending: false });
  // Re-sort so open shows first, then claimed, then fulfilled.
  const order: Record<AskStatus, number> = { open: 0, claimed: 1, fulfilled: 2 };
  return ((data as unknown as Ask[]) ?? []).sort(
    (a, b) => order[a.status] - order[b.status] ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export type AskComment = {
  id: string;
  ask_id: string;
  body: string;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null };
};

export async function listAskComments(askId: string): Promise<AskComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ask_comments")
    .select("id, ask_id, body, created_at, author:users!author_id(id, display_name, avatar_url)")
    .eq("ask_id", askId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return (data as unknown as AskComment[]) ?? [];
}

export async function listAskCommentsForAsks(askIds: string[]): Promise<AskComment[]> {
  if (askIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("ask_comments")
    .select("id, ask_id, body, created_at, author:users!author_id(id, display_name, avatar_url)")
    .in("ask_id", askIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return (data as unknown as AskComment[]) ?? [];
}

// Reputation: fulfilled asks the user completed (world-readable). Shown on profile.
export async function getFulfilledAsksForUser(userId: string): Promise<Ask[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("asks")
    .select(ASK_SELECT)
    .eq("claimed_by", userId)
    .eq("status", "fulfilled")
    .order("fulfilled_at", { ascending: false })
    .limit(50);
  return (data as unknown as Ask[]) ?? [];
}

// Open asks in the user's communities they could answer (for the Home feed).
export async function listOpenAsksForUser(userId: string, limit = 10): Promise<Ask[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId)
    .eq("status", "active");
  const ids = (memberships ?? []).map((m: { community_id: string }) => m.community_id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("asks")
    .select(ASK_SELECT)
    .in("community_id", ids)
    .eq("status", "open")
    .neq("author_id", userId) // you answer others' asks, not your own
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as Ask[]) ?? [];
}
