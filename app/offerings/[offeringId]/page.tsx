import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { MissionBadge } from "@/components/needs/mission-badge";
import { NeedIcon } from "@/components/needs/need-icon";
import { getOfferingById } from "@/lib/queries/needs";

type Props = { params: Promise<{ offeringId: string }> };

export async function generateMetadata({ params }: Props) {
  const { offeringId } = await params;
  const offering = await getOfferingById(offeringId);
  if (!offering) return { title: "Offering" };
  return {
    title: offering.title,
    description: offering.description ?? `${offering.cadence_text ?? "Ongoing"} · ${offering.community_name}`,
  };
}

function nextSession(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (d.getTime() < Date.now()) return null;
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

const label = {
  fontFamily: "var(--font-body)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--muted-foreground)",
  margin: 0,
} as const;

const value = {
  fontFamily: "var(--font-body)",
  fontSize: 15,
  color: "var(--foreground)",
  lineHeight: 1.5,
  margin: "3px 0 0",
} as const;

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ padding: "12px 0", borderTop: "1px solid var(--border)" }}>
      <p style={label}>{k}</p>
      <p style={value}>{v}</p>
    </div>
  );
}

// Offerings are public on purpose. Someone who's been handed a link to a grief group
// should be able to read what it is and when it meets without making an account —
// the sign-in wall is what keeps people who need this from ever reaching it.
export default async function OfferingPage({ params }: Props) {
  const { offeringId } = await params;
  const offering = await getOfferingById(offeringId);
  if (!offering) notFound();

  const next = nextSession(offering.next_starts_at);

  return (
    <>
      <AppNav />

      <main className="animate-page-enter" style={{ maxWidth: 560, margin: "0 auto", paddingBottom: "5rem" }}>
        <div style={{ padding: "1.25rem 1rem 0" }}>
          <Link
            href={`/community/${offering.community_slug}`}
            style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
          >
            ← {offering.community_name}
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
            <span
              style={{
                fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)",
                border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                borderRadius: 9999, padding: "2px 8px",
              }}
            >
              Ongoing
            </span>
            <MissionBadge mission={offering.mission} linked />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "2rem",
              letterSpacing: "-0.02em", lineHeight: 1.12, color: "var(--foreground)", margin: "10px 0 0",
            }}
          >
            {offering.title}
          </h1>

          {offering.description && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 16, lineHeight: 1.6, color: "var(--foreground)", margin: "12px 0 0" }}>
              {offering.description}
            </p>
          )}
        </div>

        {/* ── The practical facts, in the order someone deciding whether to come needs them ── */}
        <div style={{ padding: "1rem 1rem 0" }}>
          {offering.cadence_text && <Row k="When" v={offering.cadence_text} />}
          {next && <Row k="Next session" v={next} />}
          {offering.location && <Row k="Where" v={offering.location} />}
          {offering.facilitator_name && <Row k="Led by" v={offering.facilitator_name} />}
          {offering.cost_note && <Row k="Shared costs" v={offering.cost_note} />}
        </div>

        {/* ── Doorways this answers ─────────────────────────────────────────── */}
        {offering.needs.length > 0 && (
          <div style={{ padding: "1.5rem 1rem 0" }}>
            <p style={label}>Good for</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              {offering.needs.map((n) => (
                <Link
                  key={n.slug}
                  href={`/needs/${n.slug}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                    color: "var(--foreground)", background: "var(--card)",
                    border: "1px solid var(--border)", borderRadius: 9999,
                    padding: "7px 13px", textDecoration: "none",
                  }}
                >
                  <NeedIcon icon={n.icon} size={15} />
                  {n.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── How you actually show up ──────────────────────────────────────── */}
        <div style={{ padding: "1.75rem 1rem 0" }}>
          <Link
            href={`/community/${offering.community_slug}`}
            className="press-scale"
            style={{
              display: "block", textAlign: "center", fontFamily: "var(--font-brand)",
              fontWeight: 700, fontSize: 15, color: "var(--primary-foreground)",
              background: "var(--primary)", borderRadius: 9999,
              padding: "13px 24px", textDecoration: "none", minHeight: 44,
            }}
          >
            Go to {offering.community_name}
          </Link>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", textAlign: "center", lineHeight: 1.5, margin: "12px 0 0" }}>
            Everything here is free and peer-to-peer. Just come.
          </p>
        </div>
      </main>
    </>
  );
}
