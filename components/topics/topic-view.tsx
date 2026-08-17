"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle } from "lucide-react";
import { EmbedRender } from "@/components/topics/embed-render";
import { FlagButton } from "@/components/moderation/flag-button";
import { createTopicPost, toggleTopicReaction, createTopicComment } from "@/lib/actions/topics";
import type { TopicPost, PostComment, TopicCommunity } from "@/lib/queries/topics";

type Tab = "info" | "resources" | "communities";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function TopicView({
  topic,
  currentUserId,
  posts,
  comments,
  communities,
}: {
  topic: { id: string; slug: string; name: string };
  currentUserId: string;
  posts: TopicPost[];
  comments: PostComment[];
  communities: TopicCommunity[];
}) {
  const [tab, setTab] = useState<Tab>("info");

  const tabBtn = (t: Tab, label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1, padding: "12px 0", border: 0, background: "transparent", cursor: "pointer",
        fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
        color: tab === t ? "#e07040" : "#7c7589",
        borderBottom: tab === t ? "2px solid #e07040" : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", borderBottom: "1px solid #e8e2da", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
        {tabBtn("info", "Info")}
        {tabBtn("resources", "Resources")}
        {tabBtn("communities", "Communities")}
      </div>

      <div style={{ paddingTop: 16 }}>
        {tab === "info" && (
          <InfoFeed topic={topic} currentUserId={currentUserId} posts={posts} comments={comments} />
        )}
        {tab === "resources" && <ResourcesEntry topicSlug={topic.slug} />}
        {tab === "communities" && <CommunitiesList topic={topic} communities={communities} />}
      </div>
    </div>
  );
}

// ─── Info tab: browse. One posting field, chronological feed. ────────────────
function InfoFeed({
  topic, currentUserId, posts, comments,
}: {
  topic: { id: string; slug: string; name: string };
  currentUserId: string;
  posts: TopicPost[];
  comments: PostComment[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    const fd = new FormData();
    fd.set("topic_id", topic.id);
    fd.set("topic_slug", topic.slug);
    fd.set("body", text.trim());
    start(async () => {
      await createTopicPost(fd);
      setText("");
      router.refresh();
    });
  }

  return (
    <div>
      {/* The single posting field — paste a link or type text. Never asks type first. */}
      <form ref={formRef} onSubmit={submit} style={{ marginBottom: 20 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share a link, or start a discussion…"
          rows={3}
          style={{
            width: "100%", padding: "12px 14px", borderRadius: 14, resize: "vertical",
            border: "1px solid #e8e2da", background: "#faf8f5", fontFamily: "var(--font-body)",
            fontSize: 14.5, color: "#1a1a2e", outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="submit"
            disabled={pending || !text.trim()}
            style={{
              padding: "9px 20px", borderRadius: 999, border: 0, cursor: "pointer",
              background: "#e07040", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
              opacity: pending || !text.trim() ? 0.6 : 1,
            }}
          >
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {posts.length === 0 ? (
        <p style={{ color: "#7c7589", fontFamily: "var(--font-body)", textAlign: "center", padding: "2rem 0" }}>
          Nothing here yet. Be the first to share.
        </p>
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            topicSlug={topic.slug}
            currentUserId={currentUserId}
            comments={comments.filter((c) => c.post_id === p.id)}
          />
        ))
      )}
    </div>
  );
}

function PostCard({
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

  const likes = (post.reactions ?? []).filter((r) => r.type === "like");
  const liked = likes.some((r) => r.user_id === currentUserId);
  const topLevel = comments.filter((c) => !c.parent_id);

  function like() {
    start(async () => { await toggleTopicReaction(post.id, topicSlug); router.refresh(); });
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "#e07040" }}>
              {post.author.display_name?.[0] ?? "?"}
            </span>
          )}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>
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
        <button onClick={like} style={{ display: "flex", alignItems: "center", gap: 5, border: 0, background: "transparent", cursor: "pointer", color: liked ? "#e07040" : "#7c7589" }}>
          <Heart size={17} fill={liked ? "#e07040" : "none"} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13 }}>{likes.length || ""}</span>
        </button>
        <button onClick={() => setShowComments((s) => !s)} style={{ display: "flex", alignItems: "center", gap: 5, border: 0, background: "transparent", cursor: "pointer", color: "#7c7589" }}>
          <MessageCircle size={17} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: 13 }}>{topLevel.length || ""}</span>
        </button>
        <span style={{ marginLeft: "auto" }}>
          <FlagButton targetType="post" targetId={post.id} />
        </span>
      </div>

      {showComments && (
        <div style={{ marginTop: 12, paddingLeft: 8, borderLeft: "2px solid #f0ece5" }}>
          {topLevel.map((c) => (
            <div key={c.id} style={{ marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>{c.author.display_name}</span>{" "}
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#2a2a30" }}>{c.body}</span>
              {comments.filter((r) => r.parent_id === c.id).map((r) => (
                <div key={r.id} style={{ marginTop: 6, paddingLeft: 12 }}>
                  <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12.5, color: "#1a1a2e" }}>{r.author.display_name}</span>{" "}
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
              style={{ flex: 1, padding: "8px 12px", borderRadius: 999, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 13, outline: "none" }}
            />
            <button type="submit" style={{ padding: "8px 14px", borderRadius: 999, border: 0, background: "#e07040", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Reply
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

// ─── Resources tab: look up. Opens the filtered geographic directory. ────────
function ResourcesEntry({ topicSlug }: { topicSlug: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
      <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "#1a1a2e" }}>Find people and places near you</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#7c7589", marginTop: 6, lineHeight: 1.5, maxWidth: 360, marginInline: "auto" }}>
        A directory sorted by proximity, category, and vouches — practitioners, farms, schools,
        and more. Not a feed.
      </p>
      <Link href={`/topics/${topicSlug}/resources`} style={{
        display: "inline-block", marginTop: 14, padding: "10px 22px", borderRadius: 999,
        background: "#e07040", color: "#fff", textDecoration: "none",
        fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
      }}>
        Open the directory
      </Link>
    </div>
  );
}

// ─── Communities tab: join. Browsable list, never a blank state. ────────────
function CommunitiesList({
  topic, communities,
}: {
  topic: { id: string; slug: string; name: string };
  communities: TopicCommunity[];
}) {
  return (
    <div>
      {communities.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
          <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "#1a1a2e" }}>
            No communities here yet.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "#7c7589", marginTop: 6, lineHeight: 1.5 }}>
            Be the one who starts it. A community becomes browsable once it reaches five members —
            you recruit the first four with an invite link.
          </p>
        </div>
      ) : (
        communities.map((c) => (
          <Link key={c.id} href={`/community/${c.slug}`} style={{
            display: "block", padding: "14px 16px", marginBottom: 10, borderRadius: 14,
            border: "1px solid #e8e2da", background: "#faf8f5", textDecoration: "none", color: "#1a1a2e",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15.5 }}>{c.name}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f" }}>
                {c.public_member_count}/{c.member_cap}
              </span>
            </div>
            {c.purpose && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#7c7589", marginTop: 4, lineHeight: 1.4 }}>{c.purpose}</p>
            )}
          </Link>
        ))
      )}

      <Link href={`/community/new?topic=${topic.slug}`} style={{
        display: "block", textAlign: "center", padding: "12px 0", marginTop: 8, borderRadius: 999,
        border: "1px dashed #e07040", color: "#e07040", textDecoration: "none",
        fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
      }}>
        Start a community here
      </Link>
    </div>
  );
}
