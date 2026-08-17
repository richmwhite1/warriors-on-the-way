"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopicIcon } from "@/components/topics/topic-icon";

type Pill = { slug: string; name: string; icon: string | null };

function vibrate() {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(8);
}

// Horizontal, scrollable row of the nine objectives. Tapping one swaps ?mode=
// so the surface is shareable and back-button friendly (mirrors ikki-six/deck).
export function ObjectivePills({ topics, activeSlug }: { topics: Pill[]; activeSlug: string }) {
  const router = useRouter();
  const rowRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the active pill in view when the objective changes (via tap or swipe).
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeSlug]);

  return (
    <div
      ref={rowRef}
      className="no-scrollbar"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "2px 1rem 6px",
        scrollSnapType: "x proximity",
      }}
    >
      {topics.map((t) => {
        const active = t.slug === activeSlug;
        return (
          <button
            key={t.slug}
            ref={active ? activeRef : undefined}
            onClick={() => {
              if (active) return;
              vibrate();
              router.push(`/deck?mode=${t.slug}`, { scroll: false });
            }}
            className="press-scale"
            style={{
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9999,
              border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
              background: active ? "var(--primary)" : "var(--card)",
              color: active ? "var(--primary-foreground)" : "var(--foreground)",
              fontFamily: "var(--font-brand)",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              whiteSpace: "nowrap",
              scrollSnapAlign: "center",
              transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease",
            }}
          >
            <TopicIcon icon={t.icon} size={16} color={active ? "var(--primary-foreground)" : "var(--muted-foreground)"} />
            {t.name}
          </button>
        );
      })}
    </div>
  );
}
