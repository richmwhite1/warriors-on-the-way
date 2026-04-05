"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchYouTubeOEmbed, extractYouTubeId } from "@/lib/integrations/youtube";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  const body = (formData.get("body") as string)?.trim();
  const youtube_url = (formData.get("youtube_url") as string)?.trim() || null;
  const push_to_all = formData.get("push_to_all") === "true";

  if (!body) throw new Error("Post body is required");
  if (!community_id) throw new Error("Community ID is required");

  // Fetch YouTube oEmbed if URL provided
  let youtube_oembed = null;
  if (youtube_url && extractYouTubeId(youtube_url)) {
    youtube_oembed = await fetchYouTubeOEmbed(youtube_url);
  }

  const { error } = await supabase.from("posts").insert({
    community_id,
    author_id: user.id,
    body,
    youtube_url: youtube_url || null,
    youtube_oembed,
    push_to_all,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/community/[slug]`, "page");
  revalidatePath("/home");
}

export async function deletePost(postId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}`);
}

export async function reportPost(postId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: "post",
    target_id: postId,
    reason,
  });

  if (error) throw new Error(error.message);
}
