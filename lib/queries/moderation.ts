import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type HiddenItem = {
  id: string;
  kind: "post" | "ask" | "comment";
  body: string | null;
  title: string | null;
  hidden_at: string;
  hidden_reason: string | null;
  author: { display_name: string } | null;
  flag_count: number;
};

// Hidden (reversible) content in a community, for the steward queue. Reporter
// identities are never included — flagging is anonymous to everyone but is only
// surfaced as an aggregate count.
export async function listHiddenForCommunity(communityId: string): Promise<HiddenItem[]> {
  const admin = createAdminClient();

  const [{ data: posts }, { data: asks }] = await Promise.all([
    admin.from("posts")
      .select("id, title, body, hidden_at, hidden_reason, author:users!author_id(display_name)")
      .eq("community_id", communityId).not("hidden_at", "is", null).is("deleted_at", null),
    admin.from("asks")
      .select("id, title, body, hidden_at, hidden_reason, author:users!author_id(display_name)")
      .eq("community_id", communityId).not("hidden_at", "is", null),
  ]);

  const items: HiddenItem[] = [];
  for (const p of (posts ?? []) as Record<string, unknown>[]) {
    items.push({
      id: p.id as string, kind: "post", title: (p.title as string) ?? null, body: (p.body as string) ?? null,
      hidden_at: p.hidden_at as string, hidden_reason: (p.hidden_reason as string) ?? null,
      author: (p.author as { display_name: string }) ?? null, flag_count: 0,
    });
  }
  for (const a of (asks ?? []) as Record<string, unknown>[]) {
    items.push({
      id: a.id as string, kind: "ask", title: (a.title as string) ?? null, body: (a.body as string) ?? null,
      hidden_at: a.hidden_at as string, hidden_reason: (a.hidden_reason as string) ?? null,
      author: (a.author as { display_name: string }) ?? null, flag_count: 0,
    });
  }

  // Attach distinct flag counts.
  for (const it of items) {
    const { count } = await admin.from("reports")
      .select("reporter_id", { count: "exact", head: true })
      .eq("target_type", it.kind).eq("target_id", it.id);
    it.flag_count = count ?? 0;
  }
  return items.sort((a, b) => new Date(b.hidden_at).getTime() - new Date(a.hidden_at).getTime());
}

// Topic reviewer queue: hidden topic posts for a topic the caller reviews.
export async function listHiddenForTopic(topicId: string): Promise<HiddenItem[]> {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, hidden_at, hidden_reason, author:users!author_id(display_name)")
    .eq("topic_id", topicId)
    .is("community_id", null)
    .not("hidden_at", "is", null)
    .is("deleted_at", null);

  const admin = createAdminClient();
  const items: HiddenItem[] = [];
  for (const p of (posts ?? []) as Record<string, unknown>[]) {
    const { count } = await admin.from("reports")
      .select("reporter_id", { count: "exact", head: true })
      .eq("target_type", "post").eq("target_id", p.id as string);
    items.push({
      id: p.id as string, kind: "post", title: (p.title as string) ?? null, body: (p.body as string) ?? null,
      hidden_at: p.hidden_at as string, hidden_reason: (p.hidden_reason as string) ?? null,
      author: (p.author as { display_name: string }) ?? null, flag_count: count ?? 0,
    });
  }
  return items.sort((a, b) => new Date(b.hidden_at).getTime() - new Date(a.hidden_at).getTime());
}

// Topics the current user is a trusted reviewer for.
export async function getReviewerTopics(userId: string): Promise<{ id: string; slug: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_reviewers")
    .select("topic:topics!topic_id(id, slug, name)")
    .eq("user_id", userId);
  return ((data ?? []) as unknown as { topic: { id: string; slug: string; name: string } }[]).map((r) => r.topic);
}
