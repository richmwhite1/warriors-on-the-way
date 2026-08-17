import { createClient } from "@/lib/supabase/server";

export type Topic = {
  id: string;
  slug: string;
  name: string;
  manifesto_objective: string;
  solution_statement: string | null;
  icon: string | null;
  sort_order: number;
};

export type TopicPost = {
  id: string;
  topic_id: string | null;
  community_id: string | null;
  visibility: "topic" | "community" | "both";
  author_id: string;
  post_type: string;
  title: string | null;
  body: string | null;
  link_url: string | null;
  link_preview: {
    provider: string;
    embedUrl: string | null;
    thumbnailUrl: string | null;
    title: string | null;
    description: string | null;
    url: string;
  } | null;
  embed_provider: string | null;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null };
  comment_count?: { count: number }[];
  reactions?: Array<{ type: string; user_id: string }>;
};

const TOPIC_POST_SELECT = `
  id, topic_id, community_id, visibility, author_id, post_type, title, body,
  link_url, link_preview, embed_provider, created_at,
  author:users!author_id(id, display_name, avatar_url),
  comment_count:comments(count),
  reactions(type, user_id)
`;

export async function getTopics(): Promise<Topic[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, name, manifesto_objective, solution_statement, icon, sort_order")
    .order("sort_order", { ascending: true });
  return (data as Topic[]) ?? [];
}

export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topics")
    .select("id, slug, name, manifesto_objective, solution_statement, icon, sort_order")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Topic) ?? null;
}

// The Info tab: chronological, topic-visible posts (visibility topic or both).
export async function listTopicPosts(
  topicId: string,
  limit = 30,
  before?: string
): Promise<TopicPost[]> {
  const supabase = await createClient();
  let query = supabase
    .from("posts")
    .select(TOPIC_POST_SELECT)
    .eq("topic_id", topicId)
    .in("visibility", ["topic", "both"])
    .is("deleted_at", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("created_at", before);
  const { data } = await query;
  return (data as unknown as TopicPost[]) ?? [];
}

// Home feed input: recent posts from the topics a person follows.
export async function listFollowedTopicPosts(userId: string, limit = 15): Promise<TopicPost[]> {
  const supabase = await createClient();
  const { data: follows } = await supabase
    .from("topic_follows")
    .select("topic_id")
    .eq("user_id", userId);
  const ids = (follows ?? []).map((f: { topic_id: string }) => f.topic_id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("posts")
    .select(TOPIC_POST_SELECT + ", topic:topics!topic_id(name, slug)")
    .in("topic_id", ids)
    .in("visibility", ["topic", "both"])
    .is("deleted_at", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as TopicPost[]) ?? [];
}

// Topics a community is tagged to (for the cross-post prompt).
export async function getCommunityTopics(communityId: string): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_topics")
    .select("topic:topics!topic_id(id, name)")
    .eq("community_id", communityId);
  return ((data ?? []) as unknown as { topic: { id: string; name: string } }[]).map((r) => r.topic);
}

export type SiblingCommunity = {
  id: string;
  slug: string;
  name: string;
  purpose: string | null;
  public_member_count: number;
  member_cap: number;
  steward_name: string | null;
  shared_topics: string[];
};

// Rec 7 — other listed communities that share at least one of this community's topics,
// so stewards can find kindred groups and seed new ones. Excludes the community itself.
export async function getSiblingCommunities(
  communityId: string,
  topicIds: string[]
): Promise<SiblingCommunity[]> {
  if (topicIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_topics")
    .select("community_id, topic:topics!topic_id(name), community:communities!inner(id, slug, name, purpose, public_member_count, member_cap, status, created_by)")
    .in("topic_id", topicIds);

  const map = new Map<string, SiblingCommunity>();
  for (const row of (data ?? []) as unknown as {
    community_id: string;
    topic: { name: string } | null;
    community: { id: string; slug: string; name: string; purpose: string | null; public_member_count: number; member_cap: number; status: string; created_by: string } | null;
  }[]) {
    const c = row.community;
    if (!c || c.id === communityId || c.status !== "listed") continue;
    const existing = map.get(c.id);
    if (existing) {
      if (row.topic?.name) existing.shared_topics.push(row.topic.name);
    } else {
      map.set(c.id, {
        id: c.id, slug: c.slug, name: c.name, purpose: c.purpose,
        public_member_count: c.public_member_count, member_cap: c.member_cap,
        steward_name: null,
        shared_topics: row.topic?.name ? [row.topic.name] : [],
      });
    }
  }

  // Attach each community's creator (steward) name.
  const ids = [...map.keys()];
  if (ids.length > 0) {
    const { data: creators } = await supabase
      .from("communities")
      .select("id, created_by, creator:users!created_by(display_name)")
      .in("id", ids);
    for (const row of (creators ?? []) as unknown as { id: string; creator: { display_name: string } | null }[]) {
      const s = map.get(row.id);
      if (s) s.steward_name = row.creator?.display_name ?? null;
    }
  }

  return [...map.values()].sort((a, b) => b.shared_topics.length - a.shared_topics.length);
}

export async function getFollowedTopicIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_follows")
    .select("topic_id")
    .eq("user_id", userId);
  return (data ?? []).map((r: { topic_id: string }) => r.topic_id);
}

export async function isFollowingTopic(userId: string, topicId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_follows")
    .select("topic_id")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();
  return !!data;
}

export type PostComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null };
};

// Top-level + threaded comments for a set of posts, in one query.
export async function getCommentsForPosts(postIds: string[]): Promise<PostComment[]> {
  if (postIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("id, post_id, parent_id, body, created_at, author:users!author_id(id, display_name, avatar_url)")
    .in("post_id", postIds)
    .is("deleted_at", null)
    .is("hidden_at", null)
    .order("created_at", { ascending: true });
  return (data as unknown as PostComment[]) ?? [];
}

export type TopicCommunity = {
  id: string;
  slug: string;
  name: string;
  purpose: string | null;
  public_member_count: number;
  member_cap: number;
  latitude: number | null;
  longitude: number | null;
};

// Communities tagged to a topic that have passed the 5-member visibility gate.
export async function getListedCommunitiesForTopic(topicId: string): Promise<TopicCommunity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_topics")
    .select(
      "community:communities!inner(id, slug, name, purpose, public_member_count, member_cap, latitude, longitude, status)"
    )
    .eq("topic_id", topicId);

  const rows = (data ?? []) as unknown as {
    community: TopicCommunity & { status: string };
  }[];
  return rows
    .map((r) => r.community)
    .filter((c) => c && c.status === "listed")
    .sort((a, b) => b.public_member_count - a.public_member_count);
}

// Records a first visit if none exists; returns true when this was the first contact.
export async function recordAndCheckFirstVisit(userId: string, topicId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("topic_visits")
    .select("topic_id")
    .eq("user_id", userId)
    .eq("topic_id", topicId)
    .maybeSingle();
  if (existing) return false;
  await supabase.from("topic_visits").insert({ user_id: userId, topic_id: topicId });
  return true;
}
