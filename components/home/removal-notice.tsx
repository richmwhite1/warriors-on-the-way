"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rejoinCommunity, acknowledgeRemoval } from "@/lib/actions/activity";
import { toast } from "sonner";
import type { RemovalNotice } from "@/lib/queries/activity";

// Kind notice shown on return after an inactivity removal. Removal is never a ban —
// one tap rejoins if there's room.
export function RemovalNoticeBanner({ notices }: { notices: RemovalNotice[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const router = useRouter();
  const [pending, start] = useTransition();

  const visible = notices.filter((n) => !dismissed.has(n.community_id));
  if (visible.length === 0) return null;

  return (
    <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {visible.map((n) => {
        const full = n.community ? n.community.public_member_count >= n.community.member_cap : false;
        return (
          <div key={n.community_id} style={{
            border: "1px solid #e8dcc8", borderRadius: 14, padding: "1rem 1.15rem",
            background: "linear-gradient(135deg, #f8f4ec 0%, #fdf9f0 100%)",
          }}>
            <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "#1a1a2e", fontSize: "0.98rem" }}>
              Your seat in {n.community?.name ?? "a community"} was freed
            </p>
            <p style={{ fontFamily: "var(--font-body)", color: "#7c7589", fontSize: "0.88rem", lineHeight: 1.5, marginTop: 4 }}>
              After six quiet months we opened your spot for someone new — it&apos;s not a ban, and
              you&apos;re welcome back {full ? "when a seat frees up." : "in one tap."}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {!full && (
                <button
                  disabled={pending}
                  onClick={() => start(async () => {
                    try {
                      await rejoinCommunity(n.community_id);
                      toast.success(`Welcome back to ${n.community?.name ?? "your community"}`);
                      router.refresh();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not rejoin");
                    }
                  })}
                  style={{ padding: "8px 18px", borderRadius: 999, border: 0, background: "#6e8b6a", color: "#fff", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  Rejoin
                </button>
              )}
              <button
                disabled={pending}
                onClick={() => start(async () => {
                  await acknowledgeRemoval(n.community_id);
                  setDismissed((s) => new Set(s).add(n.community_id));
                })}
                style={{ padding: "8px 18px", borderRadius: 999, border: "1px solid #e8e2da", background: "#fff", color: "#7c7589", fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
