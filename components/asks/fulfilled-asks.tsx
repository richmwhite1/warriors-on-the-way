import { HeartHandshake } from "lucide-react";
import type { Ask } from "@/lib/queries/asks";

// Reputation currency: the asks this person has fulfilled for others.
export function FulfilledAsks({ asks, name }: { asks: Ask[]; name: string }) {
  if (asks.length === 0) return null;
  return (
    <section style={{ margin: "1.5rem 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <HeartHandshake size={16} color="var(--primary)" />
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
          {asks.length} {asks.length === 1 ? "person" : "people"} helped
        </span>
      </div>
      {asks.map((a) => (
        <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>{a.title}</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "#a39a8f", marginTop: 2 }}>
            for {a.author.display_name}{a.topic ? ` · ${a.topic.name}` : ""}
          </div>
          {a.thank_you_note && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "#4a4a45", fontStyle: "italic", marginTop: 6 }}>
              “{a.thank_you_note}”
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
