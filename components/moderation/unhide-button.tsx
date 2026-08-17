"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { stewardSetHidden, reviewerSetHidden } from "@/lib/actions/moderation";

// Restore hidden content. A lone steward/reviewer can hide or restore, but cannot
// permanently delete — restoration is always available.
export function UnhideButton({
  scope,
  kind,
  id,
  slug,
}: {
  scope: "community" | "topic";
  kind: "post" | "ask" | "comment";
  id: string;
  slug: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() =>
        start(async () => {
          if (scope === "topic") await reviewerSetHidden(id, slug, false);
          else await stewardSetHidden(kind, id, slug, false);
          router.refresh();
        })
      }
      disabled={pending}
      style={{
        padding: "7px 14px", borderRadius: 999, border: "1px solid #2e7d5b",
        background: "#fff", color: "#2e7d5b", fontFamily: "var(--font-brand)",
        fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Restoring…" : "Restore"}
    </button>
  );
}
