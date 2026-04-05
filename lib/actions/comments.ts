"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createComment(postId: string, body: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body: trimmed,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}`);
}

export async function deleteComment(commentId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}`);
}
