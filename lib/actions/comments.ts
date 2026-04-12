"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";

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

  // Notify the post author (best-effort, skip if they commented on their own post)
  try {
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (post && post.author_id !== user.id) {
      const { data: commenter } = await admin
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .single();

      await createNotification(post.author_id, "comment_on_post", {
        actor_name: (commenter as { display_name?: string } | null)?.display_name ?? "Someone",
        post_id: postId,
        community_slug: communitySlug,
      });
    }
  } catch {
    // best-effort
  }
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
