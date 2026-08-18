"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTopicPost } from "@/lib/actions/topics";
import { TopicPostCard } from "@/components/topics/topic-post-card";
import type { TopicPost, PostComment, TopicCommunity } from "@/lib/queries/topics";

type Tab = "info" | "resources" | "communities";

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
        color: tab === t ? "var(--primary)" : "var(--muted-foreground)",
        borderBottom: tab === t ? "2px solid var(--primary)" : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
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
            border: "1px solid var(--border)", background: "#faf8f5", fontFamily: "var(--font-body)",
            fontSize: 14.5, color: "var(--foreground)", outline: "none",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="submit"
            disabled={pending || !text.trim()}
            style={{
              padding: "9px 20px", borderRadius: 999, border: 0, cursor: "pointer",
              background: "var(--primary)", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
              opacity: pending || !text.trim() ? 0.6 : 1,
            }}
          >
            {pending ? "Posting…" : "Post"}
          </button>
        </div>
      </form>

      {posts.length === 0 ? (
        <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-body)", textAlign: "center", padding: "2rem 0" }}>
          Nothing here yet. Be the first to share.
        </p>
      ) : (
        posts.map((p) => (
          <TopicPostCard
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

// ─── Resources tab: look up. Opens the filtered geographic directory. ────────
function ResourcesEntry({ topicSlug }: { topicSlug: string }) {
  return (
    <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
      <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "var(--foreground)" }}>Find people and places near you</p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--muted-foreground)", marginTop: 6, lineHeight: 1.5, maxWidth: 360, marginInline: "auto" }}>
        A directory sorted by proximity, category, and vouches — practitioners, farms, schools,
        and more. Not a feed.
      </p>
      <Link href={`/topics/${topicSlug}/resources`} style={{
        display: "inline-block", marginTop: 14, padding: "10px 22px", borderRadius: 999,
        background: "var(--primary)", color: "#fff", textDecoration: "none",
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
          <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "var(--foreground)" }}>
            No communities here yet.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--muted-foreground)", marginTop: 6, lineHeight: 1.5 }}>
            Be the one who starts it. A community becomes browsable once it reaches five members —
            you recruit the first four with an invite link.
          </p>
        </div>
      ) : (
        communities.map((c) => (
          <Link key={c.id} href={`/community/${c.slug}`} style={{
            display: "block", padding: "14px 16px", marginBottom: 10, borderRadius: 14,
            border: "1px solid var(--border)", background: "#faf8f5", textDecoration: "none", color: "var(--foreground)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15.5 }}>{c.name}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f" }}>
                {c.public_member_count}/{c.member_cap}
              </span>
            </div>
            {c.purpose && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", marginTop: 4, lineHeight: 1.4 }}>{c.purpose}</p>
            )}
          </Link>
        ))
      )}

      <Link href={`/community/new?topic=${topic.slug}`} style={{
        display: "block", textAlign: "center", padding: "12px 0", marginTop: 8, borderRadius: 999,
        border: "1px dashed var(--primary)", color: "var(--primary)", textDecoration: "none",
        fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
      }}>
        Start a community here
      </Link>
    </div>
  );
}
