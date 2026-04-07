"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchYouTubeOEmbed, extractYouTubeId } from "@/lib/integrations/youtube";
import type { PostType } from "@/lib/queries/posts";

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  const post_type = (formData.get("post_type") as PostType) || "discussion";
  const title = (formData.get("title") as string)?.trim() || null;
  const body = (formData.get("body") as string)?.trim() || null;
  const embed_url = (formData.get("embed_url") as string)?.trim() || null;
  const push_to_all = formData.get("push_to_all") === "true";

  if (!community_id) throw new Error("Community ID is required");

  if ((post_type === "discussion" || post_type === "event") && !body && !title) {
    throw new Error("Post needs some content");
  }
  if ((post_type === "video" || post_type === "music") && !embed_url) {
    throw new Error("A link is required for this post type");
  }

  // For YouTube video posts, fetch oEmbed for rich thumbnail display
  let youtube_url: string | null = null;
  let youtube_oembed = null;
  if (post_type === "video" && embed_url) {
    // Reconstruct original URL from embed URL for oEmbed fetch
    const videoIdMatch = embed_url.match(/embed\/([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      youtube_url = `https://www.youtube.com/watch?v=${videoId}`;
      youtube_oembed = await fetchYouTubeOEmbed(youtube_url);
    }
  }

  const { error } = await supabase.from("posts").insert({
    community_id,
    author_id: user.id,
    post_type,
    title,
    body: body || null,
    embed_url,
    youtube_url,
    youtube_oembed,
    push_to_all,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/community/[slug]`, "page");
  revalidatePath("/home");
}

export async function pinPost(
  postId: string,
  communityId: string,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: current } = await supabase
    .from("posts")
    .select("is_pinned")
    .eq("id", postId)
    .single();

  const newPinState = !current?.is_pinned;

  if (newPinState) {
    // Unpin any currently pinned post in this community first
    await supabase
      .from("posts")
      .update({ is_pinned: false })
      .eq("community_id", communityId)
      .eq("is_pinned", true);
  }

  await supabase
    .from("posts")
    .update({ is_pinned: newPinState })
    .eq("id", postId);

  revalidatePath(`/community/${communitySlug}`);
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
