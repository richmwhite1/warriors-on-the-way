"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReactionType = "like" | "heart" | "fire";

export async function toggleReaction(
  postId: string,
  type: ReactionType,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("type", type);
  } else {
    await supabase
      .from("reactions")
      .insert({ post_id: postId, user_id: user.id, type });
  }

  revalidatePath(`/community/${communitySlug}`);
}
