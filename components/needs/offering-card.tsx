import Link from "next/link";
import { MissionBadge } from "@/components/needs/mission-badge";
import { FormatBadge } from "@/components/needs/format-badge";
import type { NeedOffering } from "@/lib/queries/needs";

function nextSession(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (d.getTime() < Date.now()) return null;
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// One standing offering. Shared by the need pages and the community page so a
// recurring gathering looks the same wherever you meet it.
export function OfferingCard({ offering, showCommunity = false }: { offering: NeedOffering; showCommunity?: boolean }) {
  const next = nextSession(offering.next_starts_at);
  // Cadence is the headline fact for a recurring thing — "Tuesdays 6pm" tells you
  // more about whether you can come than any single date does.
  const meta = [offering.cadence_text, offering.facilitator_name && `with ${offering.facilitator_name}`, offering.location]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/offerings/${offering.id}`}
      className="press-scale"
      style={{
        display: "block",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        padding: "16px 18px",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--primary)",
            border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
            borderRadius: 9999,
            padding: "2px 8px",
          }}
        >
          Ongoing
        </span>
        <MissionBadge mission={offering.mission} />
        <FormatBadge format={offering.format} />
      </div>

      <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "1.1rem", lineHeight: 1.25, color: "var(--foreground)", margin: "8px 0 0" }}>
        {offering.title}
      </p>

      {meta && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", margin: "6px 0 0" }}>{meta}</p>
      )}

      {next && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: "6px 0 0" }}>
          Next: {next}
        </p>
      )}

      {showCommunity && offering.community_name && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", margin: "6px 0 0" }}>
          {offering.community_name}
        </p>
      )}

      {offering.cost_note && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--primary)", margin: "6px 0 0" }}>{offering.cost_note}</p>
      )}

      {/* The hard part of a standing group is walking in alone; the headcount is the
          answer to that, so it belongs on the card and not only on the detail page. */}
      {offering.interest_count > 0 && (
        <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", margin: "6px 0 0" }}>
          {offering.interest_count} {offering.interest_count === 1 ? "person is" : "people are"} coming
        </p>
      )}
    </Link>
  );
}
