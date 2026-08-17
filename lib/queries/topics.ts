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
