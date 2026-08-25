"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import { EmbedRender } from "@/components/topics/embed-render";
import { FlagButton } from "@/components/moderation/flag-button";
import { toggleTopicReaction, createTopicComment, deleteTopicPost } from "@/lib/actions/topics";
import type { TopicPost, PostComment } from "@/lib/queries/topics";

export function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// The canonical renderer for a topic-scoped post: like via toggleTopicReaction,
// threaded comments via createTopicComment, link previews via EmbedRender.
// Shared by the topic detail feed (TopicView).
export function TopicPostCard({
  post, topicSlug, currentUserId, comments,
}: {
  post: TopicPost;
  topicSlug: string;
  currentUserId: string;
  comments: PostComment[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [showComments, setShowComments] = useState(false);
  const [reply, setReply] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const likes = (post.reactions ?? []).filter((r) => r.type === "like");
  const liked = likes.some((r) => r.user_id === currentUserId);
  const topLevel = comments.filter((c) => !c.parent_id);
  const isOwn = post.author_id === currentUserId;

  function like() {
    start(async () => { await toggleTopicReaction(post.id, topicSlug); router.refresh(); });
  }
  function remove() {
    setDeleting(true);
    setConfirmingDelete(false);
    start(async () => {
      try { await deleteTopicPost(post.id, topicSlug); router.refresh(); }
      catch { setDeleting(false); }
    });
  }
  function addComment(e: React.FormEvent, parentId?: string) {
    e.preventDefault();
    if (!reply.trim()) return;
    start(async () => {
      await createTopicComment(post.id, reply.trim(), topicSlug, parentId);
      setReply("");
      router.refresh();
    });
  }

  return (
    <article style={{ borderBottom: "1px solid #f0ece5", padding: "14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: "#f5f0eb", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {post.author.avatar_url ? (
            <Image src={post.author.avatar_url} alt="" width={34} height={34} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "var(--primary)" }}>
              {post.author.display_name?.[0] ?? "?"}
            </span>
          )}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>
            {post.author.display_name}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f" }}>{timeAgo(post.created_at)}</div>
        </div>
      </div>

      {post.body && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "#2a2a30", lineHeight: 1.5, margin: "10px 0 0", whiteSpace: "pre-wrap" }}>
          {post.body}
        </p>
      )}
      <EmbedRender preview={post.link_preview} />

      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 10 }}>
        <button onClick={like} style={{ display: "flex", alignItems: "center", gap: 5, border: 0, background: "transparent", cursor: "pointer", color: liked ? "var(--primary)" : "var(--muted-foreground)" }}>
          <Heart size={17} fill={liked ? "var(--primary)" : "none"} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13 }}>{likes.length || ""}</span>
        </button>
        <button onClick={() => setShowComments((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 5, border: 0, background: "transparent", cursor: "pointer", color: "var(--muted-foreground)" }}>
          <MessageCircle size={17} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13 }}>{topLevel.length || ""}</span>
        </button>
        <span style={{ marginLeft: "auto" }}>
          {isOwn ? (
            confirmingDelete ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={remove}
                  disabled={deleting}
                  aria-label="Confirm delete post"
                  style={{
                    border: 0, background: "transparent", cursor: deleting ? "default" : "pointer",
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--destructive)",
                    opacity: deleting ? 0.5 : 1,
                  }}
                >
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  style={{
                    border: 0, background: "transparent", cursor: "pointer",
                    fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)",
                  }}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                disabled={deleting}
                aria-label="Delete post"
                style={{
                  border: 0, background: "transparent", cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)",
                }}
              >
                Delete
              </button>
            )
          ) : (
            <FlagButton targetType="post" targetId={post.id} />
          )}
        </span>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, paddingLeft: 8, borderLeft: "2px solid #f0ece5" }}>
          {topLevel.map((c) => (
            <div key={c.id} style={{ marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, color: "var(--foreground)" }}>{c.author.display_name}</span>{" "}
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#2a2a30" }}>{c.body}</span>
              {comments.filter((r) => r.parent_id === c.id).map((r) => (
                <div key={r.id} style={{ marginTop: 6, paddingLeft: 12 }}>
                  <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12.5, color: "var(--foreground)" }}>{r.author.display_name}</span>{" "}
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#2a2a30" }}>{r.body}</span>
                </div>
              ))}
            </div>
          ))}
          <form onSubmit={(e) => addComment(e)} style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Add a comment…"
              style={{ flex: 1, padding: "8px 12px", borderRadius: 999, border: "1px solid var(--border)", fontFamily: "var(--font-body)", fontSize: 13, outline: "none" }}
            />
            <button type="submit" style={{ padding: "8px 14px", borderRadius: 999, border: 0, background: "var(--primary)", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
