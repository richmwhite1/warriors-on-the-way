import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PostType = "discussion" | "event" | "video" | "music";

export type Post = {
  id: string;
  community_id: string;
  author_id: string;
  post_type: PostType;
  title: string | null;
  body: string | null;
  embed_url: string | null;
  is_pinned: boolean;
  // Legacy YouTube fields (kept for backwards compat with existing posts)
  youtube_url: string | null;
  youtube_oembed: {
    title: string;
    thumbnail_url: string;
    video_id: string;
    author_name: string;
  } | null;
  push_to_all: boolean;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null };
  community?: { name: string; slug: string };
  comment_count?: number;
  reactions?: Array<{ type: string; user_id: string }>;
};

const POST_SELECT = `
  id, community_id, author_id, post_type, title, body, embed_url, is_pinned,
  youtube_url, youtube_oembed, push_to_all, created_at,
  author:users!author_id(id, display_name, avatar_url),
  comment_count:comments(count),
  reactions(type, user_id)
`;

export async function listCommunityPosts(
  communityId: string,
  _userId?: string,
  postType?: string
): Promise<Post[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("community_id", communityId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (postType && postType !== "") {
    query = query.eq("post_type", postType);
  }

  const { data } = await query;
  return (data as unknown as Post[]) ?? [];
}

export async function listParentPushPosts(
  _userId?: string
): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`
      ${POST_SELECT},
      community:communities!community_id(name, slug)
    `)
    .eq("push_to_all", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data as unknown as Post[]) ?? [];
}

// Personal feed: most recent posts from all communities the user belongs to
export async function listPersonalFeed(userId: string): Promise<Post[]> {
  const supabase = await createClient();

  // Get the user's active community IDs
  const { data: memberships } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId)
    .eq("status", "active");

  const communityIds = (memberships ?? []).map((m: { community_id: string }) => m.community_id);
  if (communityIds.length === 0) return [];

  const { data } = await supabase
    .from("posts")
    .select(`
      ${POST_SELECT},
      community:communities!community_id(name, slug)
    `)
    .in("community_id", communityIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data as unknown as Post[]) ?? [];
}

export async function getLatestParentPost(): Promise<Post | null> {
  const admin = createAdminClient();

  const { data: parent } = await admin
    .from("communities")
    .select("id, slug, name")
    .eq("is_parent", true)
    .single();

  if (!parent) return null;

  const { data } = await admin
    .from("posts")
    .select(`
      ${POST_SELECT},
      community:communities!community_id(name, slug)
    `)
    .eq("community_id", parent.id)
    .is("deleted_at", null)
    .eq("is_pinned", false)
    .order("created_at", { ascending: false })
    .limit(1);

  return (data?.[0] as unknown as Post) ?? null;
}

export async function getPost(postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`
      ${POST_SELECT},
      community:communities!community_id(name, slug)
    `)
    .eq("id", postId)
    .is("deleted_at", null)
    .single();
  return data as unknown as Post;
}
