"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTopicPost } from "@/lib/actions/topics";

// The deck's posting field. Posts straight to the active objective
// (visibility "topic", no community required — see createTopicPost). Paste a link
// and it auto-embeds; type text and it's a discussion.
export function DeckComposer({
  topicId, topicSlug, objectiveName,
}: {
  topicId: string;
  topicSlug: string;
  objectiveName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || pending) return;
    const fd = new FormData();
    fd.set("topic_id", topicId);
    fd.set("topic_slug", topicSlug);
    fd.set("body", text.trim());
    start(async () => {
      await createTopicPost(fd);
      setText("");
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="press-scale"
        style={{
          display: "block", width: "100%", textAlign: "left",
          background: "var(--card)", border: "1px solid var(--border)", borderRadius: 20,
          padding: "14px 18px", cursor: "pointer",
          fontFamily: "var(--font-body)", fontSize: 15, color: "var(--muted-foreground)",
        }}
      >
        Share something in {objectiveName}…
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{ background: "var(--card)", border: "1px solid var(--primary)", borderRadius: 20, padding: "14px 16px" }}
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Share a link, or start a discussion in ${objectiveName}…`}
        rows={3}
        style={{
          width: "100%", padding: "10px 12px", borderRadius: 14, resize: "vertical",
          border: "1px solid var(--border)", background: "var(--background)",
          fontFamily: "var(--font-body)", fontSize: 15, color: "var(--foreground)", outline: "none",
        }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => { setOpen(false); setText(""); }}
          style={{
            padding: "8px 16px", borderRadius: 9999, border: "1px solid var(--border)", background: "transparent",
            cursor: "pointer", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, color: "var(--muted-foreground)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending || !text.trim()}
          style={{
            padding: "8px 20px", borderRadius: 9999, border: 0, cursor: "pointer",
            background: "var(--primary)", color: "var(--primary-foreground)",
            fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14,
            opacity: pending || !text.trim() ? 0.6 : 1,
          }}
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
