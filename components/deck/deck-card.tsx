"use client";

import { useState } from "react";
import { TopicPostCard, timeAgo } from "@/components/topics/topic-post-card";
import type { TopicPost, PostComment } from "@/lib/queries/topics";

// Small uppercase eyebrow per post type — the "LOOKING TO" analogue from ikki-six.
const EYEBROW: Record<string, string> = {
  discussion: "Discussion",
  video: "Watch",
  music: "Listen",
  reflection: "Reflection",
  wisdom: "Wisdom",
  prayer: "Prayer & support",
  event: "Gathering",
};

function headline(post: TopicPost): string {
  if (post.title?.trim()) return post.title.trim();
  const body = (post.body ?? "").trim();
  if (body) {
    const firstLine = body.split("\n")[0];
    return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
  }
  if (post.link_preview?.title) return post.link_preview.title;
  return "Shared a link";
}

// A compact preview card. Tapping expands it in place to the full TopicPostCard
// (reactions + threaded comments), so the deck stays scannable but never loses depth.
export function DeckCard({
  post, comments, topicSlug, currentUserId,
}: {
  post: TopicPost;
  comments: PostComment[];
  topicSlug: string;
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const eyebrow = EYEBROW[post.post_type] ?? "Shared";

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "16px 18px",
        transition: "box-shadow 0.15s ease",
      }}
      className="animate-fade-up"
    >
      <div
        style={{
          fontFamily: "var(--font-brand)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted-foreground)",
        }}
      >
        {eyebrow}
      </div>

      {expanded ? (
        <>
          <TopicPostCard post={post} topicSlug={topicSlug} currentUserId={currentUserId} comments={comments} />
          <button
            onClick={() => setExpanded(false)}
            style={{
              marginTop: 4, border: 0, background: "transparent", cursor: "pointer",
              fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, color: "var(--muted-foreground)",
            }}
          >
            Show less
          </button>
        </>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="press-scale"
          style={{
            display: "block", width: "100%", textAlign: "left", border: 0, background: "transparent",
            cursor: "pointer", padding: 0, marginTop: 8,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 700,
              fontSize: "1.1rem",
              lineHeight: 1.3,
              color: "var(--foreground)",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {headline(post)}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", marginTop: 10 }}>
            {post.author.display_name} · {timeAgo(post.created_at)}
          </p>
        </button>
      )}
    </div>
  );
}
