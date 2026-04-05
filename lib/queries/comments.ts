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
