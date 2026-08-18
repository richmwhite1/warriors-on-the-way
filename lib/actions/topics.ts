"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveLink, extractFirstUrl } from "@/lib/link-resolver";

const VIDEO_PROVIDERS = new Set(["youtube", "rumble", "vimeo"]);
const MUSIC_PROVIDERS = new Set(["spotify", "soundcloud", "podcast"]);

// The one posting field: paste a link and it resolves+embeds; type text and it's a
// discussion post. Never asks the poster to choose a type first. Posting to a topic
// feed is first-class and requires NO community membership (enforced by RLS).
export async function createTopicPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const topic_id = formData.get("topic_id") as string;
  const topic_slug = formData.get("topic_slug") as string;
  const text = ((formData.get("body") as string) ?? "").trim();
  if (!topic_id) throw new Error("Topic is required");
  if (!text) throw new Error("Say something first");

  const url = extractFirstUrl(text);
  let post_type = "discussion";
  let link_url: string | null = null;
  let link_preview = null;
  let embed_provider: string | null = null;
  let display_body: string | null = text;

  if (url) {
    const preview = await resolveLink(url);
    if (preview) {
      link_url = preview.url;
      link_preview = preview;
      embed_provider = preview.provider;
      post_type = VIDEO_PROVIDERS.has(preview.provider)
        ? "video"
        : MUSIC_PROVIDERS.has(preview.provider)
        ? "music"
        : "discussion";
      // If the post was nothing but the link, drop the raw URL so it shows only
      // the player/thumbnail — an image, not a bare link.
      if (text === url) display_body = null;
    }
  }

  const { error } = await supabase.from("posts").insert({
    topic_id,
    community_id: null,
    visibility: "topic",
    author_id: user.id,
    post_type,
    body: display_body,
    link_url,
    link_preview,
    embed_provider,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/topics/${topic_slug}`);
  revalidatePath("/home");
  revalidatePath("/deck");
}

// Authors can remove their own topic posts. Soft-delete via deleted_at, written
// with the service role because the posts UPDATE policy column-gates deleted_at
// away from the user client (same pattern as the community deletePost action).
export async function deleteTopicPost(postId: string, topicSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();
  if (!post) throw new Error("Post not found");
  if (post.author_id !== user.id) throw new Error("Not authorized");

  const { error } = await admin
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw new Error(error.message);

  revalidatePath(`/topics/${topicSlug}`);
  revalidatePath("/deck");
  revalidatePath("/home");
}

export async function followTopic(topicId: string, topicSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("topic_follows").insert({ user_id: user.id, topic_id: topicId });
  revalidatePath(`/topics/${topicSlug}`);
  revalidatePath("/home");
}

export async function unfollowTopic(topicId: string, topicSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase
    .from("topic_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("topic_id", topicId);
  revalidatePath(`/topics/${topicSlug}`);
  revalidatePath("/home");
}

// Likes on topic posts (reuses the reactions table); no community context.
export async function toggleTopicReaction(postId: string, topicSlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("type", "like")
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete()
      .eq("post_id", postId).eq("user_id", user.id).eq("type", "like");
  } else {
    await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, type: "like" });
  }
  revalidatePath(`/topics/${topicSlug}`);
}

// Threaded comments on topic posts. parent_id null = top-level.
export async function createTopicComment(
  postId: string,
  body: string,
  topicSlug: string,
  parentId?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment cannot be empty");

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    body: trimmed,
    parent_id: parentId ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/topics/${topicSlug}`);
}
