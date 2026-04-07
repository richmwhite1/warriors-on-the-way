import { createClient } from "@/lib/supabase/server";

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { id: string; display_name: string; avatar_url: string | null };
};

export async function listComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(`
      id, post_id, author_id, body, created_at,
      author:users!author_id(id, display_name, avatar_url)
    `)
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  return (data as unknown as Comment[]) ?? [];
}

// Bulk fetch comments for multiple posts — avoids N+1 on the feed page
export async function listCommentsByPostIds(
  postIds: string[]
): Promise<Record<string, Comment[]>> {
  if (postIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select(`
      id, post_id, author_id, body, created_at,
      author:users!author_id(id, display_name, avatar_url)
    `)
    .in("post_id", postIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const result: Record<string, Comment[]> = {};
  for (const comment of (data as unknown as Comment[]) ?? []) {
    if (!result[comment.post_id]) result[comment.post_id] = [];
    result[comment.post_id].push(comment);
  }
  return result;
}
