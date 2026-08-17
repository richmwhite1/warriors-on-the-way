"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crossPostToTopic, dismissCrossPostPrompt } from "@/lib/actions/posts";
import { toast } from "sonner";

type TopicOpt = { id: string; name: string };

// Rec 10 — appears on the author's own community post once it has local traction,
// inviting them to share it out to a topic feed. Opt-in after the fact. Defaults to
// the community's single topic; if it has several, the author picks.
export function CrossPostPrompt({
  postId,
  communitySlug,
  topics,
}: {
  postId: string;
  communitySlug: string;
  topics: TopicOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState(topics[0]?.id ?? "");
  const [gone, setGone] = useState(false);

  if (gone || topics.length === 0) return null;

  return (
    <div style={{
      marginTop: 10, padding: "10px 12px", borderRadius: 12,
      border: "1px solid #f0d9c8", background: "#fff8f3",
    }}>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#8a5a3c", lineHeight: 1.45 }}>
        This is resonating here. Want to share it to the wider topic feed too?
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
        {topics.length > 1 && (
          <select value={picked} onChange={(e) => setPicked(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 13, background: "#fff" }}>
            {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <button
          disabled={pending || !picked}
          onClick={() => start(async () => {
            try {
              await crossPostToTopic(postId, picked, communitySlug);
              toast.success("Shared to the topic feed");
              setGone(true);
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not share");
            }
          })}
          style={{ padding: "6px 14px", borderRadius: 999, border: 0, background: "#6e8b6a", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: pending ? 0.6 : 1 }}
        >
          Share to {topics.length === 1 ? topics[0].name : "topic"}
        </button>
        <button
          disabled={pending}
          onClick={() => start(async () => { await dismissCrossPostPrompt(postId, communitySlug); setGone(true); })}
          style={{ padding: "6px 12px", borderRadius: 999, border: 0, background: "transparent", color: "#a39a8f", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
