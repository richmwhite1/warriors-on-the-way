import Link from "next/link";

// A compact card for the non-post content surfaced within an objective —
// gatherings, asks/offers, and communities to join. Same eyebrow/headline/meta
// anatomy as DeckCard, but it links straight to the existing detail route.
export type DeckMeta =
  | { kind: "event"; href: string; eyebrow: string; headline: string; meta: string }
  | { kind: "ask"; href: string; eyebrow: string; headline: string; meta: string }
  | { kind: "community"; href: string; eyebrow: string; headline: string; meta: string };

export function MetaCard({ item }: { item: DeckMeta }) {
  return (
    <Link
      href={item.href}
      className="press-scale animate-fade-up"
      style={{
        display: "block",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "16px 18px",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-brand)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--primary)",
        }}
      >
        {item.eyebrow}
      </div>
      <p
        style={{
          fontFamily: "var(--font-brand)",
          fontWeight: 700,
          fontSize: "1.1rem",
          lineHeight: 1.3,
          color: "var(--foreground)",
          margin: "8px 0 0",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.headline}
      </p>
      <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", marginTop: 10 }}>
        {item.meta}
      </p>
    </Link>
  );
}
