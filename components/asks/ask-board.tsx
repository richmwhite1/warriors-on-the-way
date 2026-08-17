"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HandHelping, HeartHandshake, Check } from "lucide-react";
import {
  createAsk, claimAsk, unclaimAsk, fulfillAsk, addAskComment,
} from "@/lib/actions/asks";
import { FlagButton } from "@/components/moderation/flag-button";
import type { Ask, AskComment } from "@/lib/queries/asks";

type TopicOpt = { id: string; name: string };

export function AskBoard({
  communityId, communitySlug, currentUserId, asks, comments, topics,
}: {
  communityId: string;
  communitySlug: string;
  currentUserId: string;
  asks: Ask[];
  comments: AskComment[];
  topics: TopicOpt[];
}) {
  const [composing, setComposing] = useState(false);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: 20, color: "#1a1a2e", margin: 0 }}>
          Ask &amp; Offer
        </h2>
        <button
          onClick={() => setComposing((c) => !c)}
          style={{ padding: "8px 16px", borderRadius: 999, border: 0, background: "#e07040", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          {composing ? "Close" : "+ Post"}
        </button>
      </div>

      {composing && (
        <AskComposer
          communityId={communityId}
          communitySlug={communitySlug}
          topics={topics}
          onDone={() => setComposing(false)}
        />
      )}

      {asks.length === 0 ? (
        <p style={{ color: "#7c7589", fontFamily: "var(--font-body)", textAlign: "center", padding: "2rem 0" }}>
          No asks or offers yet. Post the first — someone here can help.
        </p>
      ) : (
        asks.map((a) => (
          <AskCard
            key={a.id}
            ask={a}
            communitySlug={communitySlug}
            currentUserId={currentUserId}
            comments={comments.filter((c) => c.ask_id === a.id)}
          />
        ))
      )}
    </div>
  );
}

function AskComposer({
  communityId, communitySlug, topics, onDone,
}: {
  communityId: string;
  communitySlug: string;
  topics: TopicOpt[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<"ask" | "offer">("ask");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("community_id", communityId);
    fd.set("community_slug", communitySlug);
    fd.set("kind", kind);
    start(async () => { await createAsk(fd); router.refresh(); onDone(); });
  }

  const pill = (k: "ask" | "offer", label: string) => (
    <button type="button" onClick={() => setKind(k)} style={{
      flex: 1, padding: "8px 0", borderRadius: 999, border: `1px solid ${kind === k ? "#e07040" : "#e8e2da"}`,
      background: kind === k ? "#fdf0e9" : "#fff", color: kind === k ? "#e07040" : "#7c7589",
      fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer",
    }}>{label}</button>
  );

  return (
    <form onSubmit={submit} style={{ border: "1px solid #e8e2da", borderRadius: 14, padding: 14, marginBottom: 18, background: "#faf8f5" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {pill("ask", "I need help")}
        {pill("offer", "I can help")}
      </div>
      <input name="title" placeholder={kind === "ask" ? "What do you need?" : "What can you offer?"} required
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 14, marginBottom: 8, outline: "none" }} />
      <textarea name="body" placeholder="Any details…" rows={2}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 14, marginBottom: 8, outline: "none", resize: "vertical" }} />
      <select name="topic_id" defaultValue="" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 14, marginBottom: 10, background: "#fff" }}>
        <option value="">Tag a topic (optional)</option>
        {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button type="submit" disabled={pending} style={{ width: "100%", padding: "10px 0", borderRadius: 999, border: 0, background: "#e07040", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
        {pending ? "Posting…" : "Post"}
      </button>
    </form>
  );
}

function AskCard({
  ask, communitySlug, currentUserId, comments,
}: {
  ask: Ask;
  communitySlug: string;
  currentUserId: string;
  comments: AskComment[];
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const [thankYou, setThankYou] = useState("");
  const [reply, setReply] = useState("");
  const [showThank, setShowThank] = useState(false);

  const isAuthor = ask.author_id === currentUserId;
  const isClaimer = ask.claimed_by === currentUserId;

  const statusColor = ask.status === "open" ? "#2e7d5b" : ask.status === "claimed" ? "#b07d1c" : "#7c7589";
  const statusBg = ask.status === "open" ? "#e7f4ec" : ask.status === "claimed" ? "#fbf1dc" : "#f0ece5";

  const act = (fn: () => Promise<void>) => start(async () => { await fn(); router.refresh(); });

  return (
    <article style={{ border: "1px solid #e8e2da", borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {ask.kind === "ask" ? <HandHelping size={16} color="#e07040" /> : <HeartHandshake size={16} color="#e07040" />}
        <span style={{ fontFamily: "var(--font-body)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a39a8f" }}>
          {ask.kind === "ask" ? "Needs help" : "Offering"}
        </span>
        {ask.topic && (
          <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#e07040", background: "#fdf0e9", padding: "2px 8px", borderRadius: 999 }}>
            {ask.topic.name}
          </span>
        )}
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 11, color: statusColor, background: statusBg, padding: "3px 10px", borderRadius: 999, textTransform: "capitalize" }}>
          {ask.status === "fulfilled" ? <><Check size={11} style={{ display: "inline", verticalAlign: "-1px" }} /> fulfilled</> : ask.status}
        </span>
      </div>

      <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>{ask.title}</div>
      {ask.body && <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#4a4a45", margin: "4px 0 0", lineHeight: 1.5 }}>{ask.body}</p>}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f" }}>
          by {ask.author.display_name}
          {ask.claimer && ask.status !== "open" && <> · {ask.status === "fulfilled" ? "fulfilled by" : "claimed by"} {ask.claimer.display_name}</>}
        </span>
        {!isAuthor && <FlagButton targetType="ask" targetId={ask.id} communityId={ask.community_id} />}
      </div>

      {ask.status === "fulfilled" && ask.thank_you_note && (
        <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: "#f0ece5", fontFamily: "var(--font-body)", fontSize: 13, color: "#4a4a45", fontStyle: "italic" }}>
          “{ask.thank_you_note}”
        </div>
      )}

      {/* Lifecycle actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {ask.status === "open" && !isAuthor && (
          <button onClick={() => act(() => claimAsk(ask.id, communitySlug))} style={btn()}>
            {ask.kind === "ask" ? "I'll help" : "Take up offer"}
          </button>
        )}
        {ask.status === "claimed" && (isClaimer || isAuthor) && (
          <button onClick={() => act(() => unclaimAsk(ask.id, communitySlug))} style={btnGhost()}>
            Step back
          </button>
        )}
        {ask.status === "claimed" && isAuthor && (
          <button onClick={() => setShowThank((s) => !s)} style={btn()}>
            Mark fulfilled
          </button>
        )}
      </div>

      {showThank && ask.status === "claimed" && isAuthor && (
        <div style={{ marginTop: 10 }}>
          <input value={thankYou} onChange={(e) => setThankYou(e.target.value)} placeholder="Leave a thank-you (optional)…"
            style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 13, outline: "none", marginBottom: 8 }} />
          <button onClick={() => act(() => fulfillAsk(ask.id, communitySlug, thankYou))} style={btn()}>
            Confirm &amp; thank
          </button>
        </div>
      )}

      {/* Coordination thread (no DMs) */}
      {ask.status !== "fulfilled" && (
        <div style={{ marginTop: 12, borderTop: "1px solid #f0ece5", paddingTop: 10 }}>
          {comments.map((c) => (
            <div key={c.id} style={{ marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12.5, color: "#1a1a2e" }}>{c.author.display_name}</span>{" "}
              <span style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#2a2a30" }}>{c.body}</span>
            </div>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); if (!reply.trim()) return; act(() => addAskComment(ask.id, reply, communitySlug)); setReply(""); }} style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Coordinate here…"
              style={{ flex: 1, padding: "8px 12px", borderRadius: 999, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 13, outline: "none" }} />
            <button type="submit" style={{ padding: "8px 14px", borderRadius: 999, border: 0, background: "#4a4a45", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Send</button>
          </form>
        </div>
      )}
    </article>
  );
}

function btn(): React.CSSProperties {
  return { padding: "8px 16px", borderRadius: 999, border: 0, background: "#e07040", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" };
}
function btnGhost(): React.CSSProperties {
  return { padding: "8px 16px", borderRadius: 999, border: "1px solid #e8e2da", background: "#fff", color: "#7c7589", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" };
}
