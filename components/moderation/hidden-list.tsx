import { UnhideButton } from "@/components/moderation/unhide-button";
import type { HiddenItem } from "@/lib/queries/moderation";

// Shared render for a steward or reviewer queue of hidden (reversible) content.
export function HiddenList({
  items,
  scope,
  slug,
}: {
  items: HiddenItem[];
  scope: "community" | "topic";
  slug: string;
}) {
  if (items.length === 0) {
    return (
      <div style={{ border: "1px dashed #e8e2da", borderRadius: 16, padding: "3rem 2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "#7c7589" }}>Nothing hidden. All clear.</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((it) => (
        <article key={`${it.kind}-${it.id}`} style={{ border: "1px solid #e8e2da", borderRadius: 14, padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#a39a8f" }}>
              {it.kind}
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "#b91c1c", background: "#fbeaea", padding: "2px 8px", borderRadius: 999 }}>
              {it.flag_count} {it.flag_count === 1 ? "flag" : "flags"}
            </span>
          </div>
          {it.title && <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{it.title}</div>}
          {it.body && <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "#4a4a45", margin: "4px 0 0", lineHeight: 1.5 }}>{it.body.slice(0, 400)}</p>}
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f", marginTop: 6 }}>
            by {it.author?.display_name ?? "unknown"} · reason: {it.hidden_reason ?? "—"}
          </div>
          <div style={{ marginTop: 10 }}>
            <UnhideButton scope={scope} kind={it.kind} id={it.id} slug={slug} />
          </div>
        </article>
      ))}
    </div>
  );
}
