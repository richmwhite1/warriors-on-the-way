"use server";

import { requireUserProfile } from "@/lib/queries/users";
import { getTopicBySlug, listTopicPosts, getCommentsForPosts, type TopicPost, type PostComment } from "@/lib/queries/topics";

const PAGE = 15;

// Cursor pagination for a single objective's post feed. Reuses listTopicPosts's
// existing `before` parameter; returns hasMore so the client knows when to stop.
export async function loadMoreDeckPosts(
  topicSlug: string,
  before: string
): Promise<{ posts: TopicPost[]; comments: PostComment[]; hasMore: boolean }> {
  await requireUserProfile();
  const topic = await getTopicBySlug(topicSlug);
  if (!topic) return { posts: [], comments: [], hasMore: false };

  const posts = await listTopicPosts(topic.id, PAGE, before);
  const comments = posts.length > 0 ? await getCommentsForPosts(posts.map((p) => p.id)) : [];
  return { posts, comments, hasMore: posts.length === PAGE };
}
