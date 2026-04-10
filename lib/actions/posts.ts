"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchYouTubeOEmbed } from "@/lib/integrations/youtube";
import { sendPostNotification } from "@/lib/integrations/telegram";
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

  // ── Telegram notifications ──────────────────────────────────────────────────
  // Use admin client so RLS doesn't filter out communities the user can't see
  const admin = createAdminClient();

  // Get author display name once
  const { data: author } = await admin
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();
  const authorName = (author as { display_name?: string } | null)?.display_name ?? "A member";

  const postText = body ?? title ?? "";

  if (push_to_all) {
    // Broadcast: notify every community that has Telegram connected AND allows this post type
    const { data: allCommunities } = await admin
      .from("communities")
      .select("id, slug, name, telegram_chat_id, telegram_push_types")
      .not("telegram_chat_id", "is", null);

    if (allCommunities) {
      await Promise.allSettled(
        (allCommunities as { id: string; slug: string; name: string; telegram_chat_id: string; telegram_push_types: string[] | null }[])
          .filter((c) => {
            if (!c.telegram_chat_id) return false;
            const allowed = c.telegram_push_types ?? ["discussion", "video", "music", "event"];
            return allowed.includes(post_type);
          })
          .map((c) =>
            sendPostNotification(c.telegram_chat_id, {
              communityName: c.name,
              communitySlug: c.slug,
              authorName,
              body: postText,
              postType: post_type,
            })
          )
      );
    }
  } else {
    // Single community notification
    const { data: community } = await admin
      .from("communities")
      .select("slug, name, telegram_chat_id, telegram_push_types")
      .eq("id", community_id)
      .single();

    const c = community as { slug: string; name: string; telegram_chat_id?: string | null; telegram_push_types?: string[] | null } | null;
    const chatId = c?.telegram_chat_id;
    const allowed = c?.telegram_push_types ?? ["discussion", "video", "music", "event"];

    if (chatId && allowed.includes(post_type)) {
      await sendPostNotification(chatId, {
        communityName: c!.name,
        communitySlug: c!.slug,
        authorName,
        body: postText,
        postType: post_type,
      }).catch(() => {
        // Don't fail the post if Telegram is unreachable
      });
    }
  }
  // ───────────────────────────────────────────────────────────────────────────

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
