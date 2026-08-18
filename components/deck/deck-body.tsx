"use client";

import { useState } from "react";
import Link from "next/link";
import { DeckCard } from "@/components/deck/deck-card";
import { DeckStack } from "@/components/deck/deck-stack";
import { DeckComposer } from "@/components/deck/deck-composer";
import { MetaCard, type DeckMeta } from "@/components/deck/meta-card";
import { DeckLoadMore } from "@/components/deck/deck-load-more";
import type { TopicPost, PostComment } from "@/lib/queries/topics";

type View = "feed" | "stack";

const emptyActionStyle: React.CSSProperties = {
  fontFamily: "var(--font-brand)",
  fontWeight: 700,
  fontSize: 13,
  color: "var(--primary)",
  background: "var(--secondary)",
  padding: "8px 14px",
  borderRadius: 9999,
  textDecoration: "none",
};

// Client body of the deck: switches between the scrolling Feed (full interaction,
// mixed content) and the swipeable Stack (Axis 2). Fed plain data by the server page.
export function DeckBody({
  posts, comments, topMeta, communityMeta, objectiveName, topicId, topicSlug, currentUserId,
  lastCursor, initialHasMore, empty,
}: {
  posts: TopicPost[];
  comments: PostComment[];
  topMeta: DeckMeta[];
  communityMeta: DeckMeta[];
  objectiveName: string;
  topicId: string;
  topicSlug: string;
  currentUserId: string;
  lastCursor: string;
  initialHasMore: boolean;
  empty: boolean;
}) {
  const [view, setView] = useState<View>("feed");

  if (empty) {
    return (
      <section style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 16 }}>
        <DeckComposer topicId={topicId} topicSlug={topicSlug} objectiveName={objectiveName} />
        <div style={{ textAlign: "center", padding: "2rem 1rem 1rem" }}>
          <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "1rem", color: "var(--foreground)", margin: 0 }}>
            Nothing in {objectiveName} yet
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted-foreground)", marginTop: 6 }}>
            Be the first to share something — paste a link or start a discussion above.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/community" className="press-scale" style={emptyActionStyle}>
              Find a community
            </Link>
            <Link href="/topics" className="press-scale" style={emptyActionStyle}>
              Explore other objectives
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const seg = (v: View, label: string) => (
    <button
      onClick={() => setView(v)}
      style={{
        flex: 1, padding: "7px 0", borderRadius: 9999, border: 0, cursor: "pointer",
        fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13,
        background: view === v ? "var(--card)" : "transparent",
        color: view === v ? "var(--foreground)" : "var(--muted-foreground)",
        boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <section style={{ padding: "1rem" }}>
      {/* Feed / Stack segmented control — only meaningful when there are posts. */}
      {posts.length > 0 && (
        <div
          style={{
            display: "flex", gap: 4, padding: 4, marginBottom: 14, borderRadius: 9999,
            background: "var(--secondary)", maxWidth: 220, marginLeft: "auto", marginRight: "auto",
          }}
        >
          {seg("feed", "Feed")}
          {seg("stack", "Stack")}
        </div>
      )}

      {view === "stack" && posts.length > 0 ? (
        <DeckStack posts={posts} topicSlug={topicSlug} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <DeckComposer topicId={topicId} topicSlug={topicSlug} objectiveName={objectiveName} />

          {topMeta.map((m) => (
            <MetaCard key={`${m.kind}-${m.href}`} item={m} />
          ))}

          {posts.map((p) => (
            <DeckCard
              key={p.id}
              post={p}
              comments={comments.filter((c) => c.post_id === p.id)}
              topicSlug={topicSlug}
              currentUserId={currentUserId}
            />
          ))}

          {lastCursor && (
            <DeckLoadMore
              topicSlug={topicSlug}
              currentUserId={currentUserId}
              initialCursor={lastCursor}
              initialHasMore={initialHasMore}
            />
          )}

          {communityMeta.length > 0 && (
            <>
              <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted-foreground)", margin: "12px 0 0" }}>
                Communities in {objectiveName}
              </p>
              {communityMeta.map((m) => (
                <MetaCard key={`${m.kind}-${m.href}`} item={m} />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
}
