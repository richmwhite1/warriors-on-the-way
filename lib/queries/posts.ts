import { createClient } from "@/lib/supabase/server";

export type Post = {
  id: string;
  community_id: string;
  author_id: string;
  body: string;
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
};

export async function listCommunityPosts(communityId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`
      id, community_id, author_id, body, youtube_url, youtube_oembed,
      push_to_all, created_at,
      author:users!author_id(id, display_name, avatar_url),
      comment_count:comments(count)
    `)
    .eq("community_id", communityId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as unknown as Post[]) ?? [];
}

export async function listParentPushPosts(): Promise<Post[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`
      id, community_id, author_id, body, youtube_url, youtube_oembed,
      push_to_all, created_at,
      author:users!author_id(id, display_name, avatar_url),
      community:communities!community_id(name, slug),
      comment_count:comments(count)
    `)
    .eq("push_to_all", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(10);
  return (data as unknown as Post[]) ?? [];
}

export async function getPost(postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(`
      id, community_id, author_id, body, youtube_url, youtube_oembed,
      push_to_all, created_at,
      author:users!author_id(id, display_name, avatar_url),
      community:communities!community_id(name, slug)
    `)
    .eq("id", postId)
    .is("deleted_at", null)
    .single();
  return data as unknown as Post;
}
