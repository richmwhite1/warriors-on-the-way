"use client";

import { useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/components/topics/topic-post-card";
import type { TopicPost } from "@/lib/queries/topics";

const EYEBROW: Record<string, string> = {
  discussion: "Discussion", video: "Watch", music: "Listen",
  reflection: "Reflection", wisdom: "Wisdom", prayer: "Prayer & support", event: "Gathering",
};

function headline(post: TopicPost): string {
  if (post.title?.trim()) return post.title.trim();
  const body = (post.body ?? "").trim();
  if (body) return body.length > 140 ? `${body.slice(0, 140)}…` : body;
  return post.link_preview?.title ?? "Shared a link";
}

// Axis 2: a Tinder-style browse of an objective's posts. Non-destructive — flinging
// a card advances to the next; reaching the end offers "Start over". Full interaction
// (reactions, comments) lives in Feed view; the stack opens a post in its topic page.
export function DeckStack({ posts, topicSlug }: { posts: TopicPost[]; topicSlug: string }) {
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState(0);
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  if (posts.length === 0) return null;

  if (idx >= posts.length) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", margin: 0 }}>
          That&rsquo;s everyone for now
        </p>
        <button
          onClick={() => setIdx(0)}
          className="press-scale"
          style={{
            marginTop: 14, padding: "10px 22px", borderRadius: 9999, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--foreground)", fontFamily: "var(--font-brand)",
            fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          Start over
        </button>
      </div>
    );
  }

  function fling(dir: 1 | -1) {
    setLeaving(dir);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
    window.setTimeout(() => {
      setLeaving(0);
      setDrag(0);
      setIdx((i) => i + 1);
    }, 220);
  }

  function onDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse") return;
    setStart({ x: e.clientX, y: e.clientY });
  }
  function onMove(e: React.PointerEvent) {
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy)) setDrag(dx);
  }
  function onUp() {
    if (!start) return;
    setStart(null);
    if (Math.abs(drag) > 100) fling(drag < 0 ? -1 : 1);
    else setDrag(0);
  }

  // Render the top three cards for depth.
  const stack = posts.slice(idx, idx + 3);

  return (
    <div style={{ position: "relative", height: 340, marginTop: 8 }}>
      {stack.map((post, depth) => {
        const isTop = depth === 0;
        const offset = leaving ? leaving * 600 : isTop ? drag : 0;
        const rot = isTop ? offset / 20 : 0;
        return (
          <div
            key={post.id}
            onPointerDown={isTop ? onDown : undefined}
            onPointerMove={isTop ? onMove : undefined}
            onPointerUp={isTop ? onUp : undefined}
            onPointerCancel={isTop ? () => { setStart(null); setDrag(0); } : undefined}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10 - depth,
              transform: `translateX(${offset}px) translateY(${depth * 10}px) scale(${1 - depth * 0.04}) rotate(${rot}deg)`,
              transition: (isTop && start) ? "none" : "transform 0.22s cubic-bezier(0.2,0,0,1)",
              touchAction: "pan-y",
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 24,
              padding: "22px 22px",
              boxShadow: isTop ? "0 8px 30px rgba(0,0,0,0.08)" : "0 2px 10px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ fontFamily: "var(--font-brand)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)" }}>
              {EYEBROW[post.post_type] ?? "Shared"}
            </div>
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.3, color: "var(--foreground)", margin: "12px 0 0", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {headline(post)}
            </p>
            <div style={{ marginTop: "auto", paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)" }}>
                {post.author.display_name} · {timeAgo(post.created_at)}
              </span>
              {isTop && (
                <Link
                  href={`/topics/${topicSlug}`}
                  style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
                >
                  Open →
                </Link>
              )}
            </div>
          </div>
        );
      })}

      {/* Manual controls — accessible alternative to the swipe gesture. */}
      <div style={{ position: "absolute", bottom: -56, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
        <button onClick={() => fling(-1)} className="press-scale" aria-label="Skip back" style={ctrlStyle}>‹</button>
        <button onClick={() => fling(1)} className="press-scale" aria-label="Next" style={ctrlStyle}>›</button>
      </div>
    </div>
  );
}

const ctrlStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 9999, border: "1px solid var(--border)",
  background: "var(--card)", color: "var(--foreground)", fontSize: 22, lineHeight: 1,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
};
