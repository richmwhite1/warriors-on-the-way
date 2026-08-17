"use client";

import { useState, useTransition } from "react";
import { DeckCard } from "@/components/deck/deck-card";
import { loadMoreDeckPosts } from "@/lib/actions/deck";
import type { TopicPost, PostComment } from "@/lib/queries/topics";

// Renders "Load more" for an objective's post feed and appends the next page
// in place. Seeded with the cursor of the last server-rendered post.
export function DeckLoadMore({
  topicSlug, currentUserId, initialCursor, initialHasMore,
}: {
  topicSlug: string;
  currentUserId: string;
  initialCursor: string;
  initialHasMore: boolean;
}) {
  const [posts, setPosts] = useState<TopicPost[]>([]);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, start] = useTransition();

  function loadMore() {
    start(async () => {
      const res = await loadMoreDeckPosts(topicSlug, cursor);
      setPosts((prev) => [...prev, ...res.posts]);
      setComments((prev) => [...prev, ...res.comments]);
      if (res.posts.length > 0) setCursor(res.posts[res.posts.length - 1].created_at);
      setHasMore(res.hasMore);
    });
  }

  return (
    <>
      {posts.map((p) => (
        <DeckCard
          key={p.id}
          post={p}
          comments={comments.filter((c) => c.post_id === p.id)}
          topicSlug={topicSlug}
          currentUserId={currentUserId}
        />
      ))}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={pending}
          className="press-scale"
          style={{
            alignSelf: "center",
            marginTop: 4,
            padding: "10px 22px",
            borderRadius: 9999,
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--foreground)",
            fontFamily: "var(--font-brand)",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "Loading…" : "Load more"}
        </button>
      )}
    </>
  );
}
