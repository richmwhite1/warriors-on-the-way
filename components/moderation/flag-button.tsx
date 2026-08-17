"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { flagContent } from "@/lib/actions/moderation";

// Small, quiet flag affordance. Anonymous to the accused. One flag per person.
export function FlagButton({
  targetType,
  targetId,
  communityId = null,
}: {
  targetType: "post" | "comment" | "ask";
  targetId: string;
  communityId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f" }}>Flagged — thank you</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Flag"
        style={{ border: 0, background: "transparent", cursor: "pointer", color: "#c4bcb2", display: "inline-flex", alignItems: "center" }}
      >
        <Flag size={15} />
      </button>
      {open && (
        <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why? (not shown to the author)"
            style={{ flex: 1, padding: "7px 11px", borderRadius: 999, border: "1px solid #e8e2da", fontFamily: "var(--font-body)", fontSize: 12.5, outline: "none" }}
          />
          <button
            onClick={() => start(async () => { await flagContent(targetType, targetId, communityId, reason); setDone(true); })}
            disabled={pending}
            style={{ padding: "7px 12px", borderRadius: 999, border: 0, background: "#b91c1c", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 12.5, cursor: "pointer", opacity: pending ? 0.6 : 1 }}
          >
            Flag
          </button>
        </div>
      )}
    </>
  );
}
