import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNeedBySlug,
  listOfferingsForNeed,
  listEventsForNeed,
  listPractitionersForNeed,
} from "@/lib/queries/needs";
import { AppNav } from "@/components/app-nav";
import { NeedIcon } from "@/components/needs/need-icon";
import { MissionBadge } from "@/components/needs/mission-badge";
import { OfferingCard } from "@/components/needs/offering-card";

function eventDate(iso: string | null): string {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const sectionTitle = {
  fontFamily: "var(--font-brand)",
  fontWeight: 800,
  fontSize: "0.95rem",
  letterSpacing: "0.02em",
  color: "var(--foreground)",
  margin: "1.75rem 0 0.75rem",
} as const;

const card = {
  display: "block",
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: "16px 18px",
  textDecoration: "none",
} as const;

const cardTitle = {
  fontFamily: "var(--font-brand)",
  fontWeight: 700,
  fontSize: "1.1rem",
  lineHeight: 1.25,
  color: "var(--foreground)",
  margin: "8px 0 0",
} as const;

const cardMeta = {
  fontFamily: "var(--font-body)",
  fontSize: 13,
  color: "var(--muted-foreground)",
  margin: "6px 0 0",
} as const;

export default async function NeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const need = await getNeedBySlug(slug);
  if (!need) notFound();

  const [offerings, events, practitioners] = await Promise.all([
    listOfferingsForNeed(need.id),
    listEventsForNeed(need.id),
    listPractitionersForNeed(need.id),
  ]);

  const empty = offerings.length === 0 && events.length === 0 && practitioners.length === 0;

  return (
    <>
      <AppNav />

      <main className="animate-page-enter" style={{ maxWidth: 560, margin: "0 auto", paddingBottom: "5rem" }}>
        {/* ── Need header ────────────────────────────────────────────────────── */}
        <header style={{ padding: "1.25rem 1rem 0.25rem" }}>
          <Link href="/menu" style={{ fontFamily: "var(--font-brand)", fontSize: 13, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}>
            ← Menu
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--primary) 8%, transparent)" }}>
              <NeedIcon icon={need.icon} size={24} />
            </div>
            <h1 style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "1.9rem", letterSpacing: "-0.02em", color: "var(--foreground)", margin: 0 }}>
              {need.name}
            </h1>
          </div>
          {need.prompt && (
            <p style={{ fontFamily: "var(--font-body)", fontStyle: "italic", fontSize: 15, color: "var(--muted-foreground)", lineHeight: 1.5, margin: "12px 0 0" }}>
              “{need.prompt}”
            </p>
          )}
        </header>

        <div style={{ padding: "0 1rem" }}>
          {empty && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6, marginTop: "2rem" }}>
              Nothing here yet. As people add offerings and gatherings for this doorway, they’ll appear here.
            </p>
          )}
          {empty && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6, marginTop: "0.75rem" }}>
              <Link href="/community" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                Find a community near you →
              </Link>
            </p>
          )}

          {/* ── Ongoing offerings ────────────────────────────────────────────── */}
          {offerings.length > 0 && (
            <>
              <h2 style={sectionTitle}>Ongoing offerings</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {offerings.map((o) => (
                  <OfferingCard key={o.id} offering={o} showCommunity />
                ))}
              </div>
            </>
          )}

          {/* ── Upcoming gatherings (one-off events) ─────────────────────────── */}
          {events.length > 0 && (
            <>
              <h2 style={sectionTitle}>Upcoming gatherings</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {events.map((e) => (
                  <Link key={e.id} href={`/community/${e.community_slug}/events/${e.id}`} className="press-scale" style={card}>
                    <MissionBadge mission={e.mission} />
                    <p style={cardTitle}>{e.title}</p>
                    <p style={cardMeta}>{eventDate(e.starts_at)} · {e.community_name}</p>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* ── People & practitioners ───────────────────────────────────────── */}
          {practitioners.length > 0 && (
            <>
              <h2 style={sectionTitle}>People &amp; practitioners</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {practitioners.map((p) => {
                  const inner = (
                    <>
                      <MissionBadge mission={p.mission} />
                      <p style={cardTitle}>{p.title}</p>
                      {p.description && <p style={cardMeta}>{p.description}</p>}
                      {p.address && <p style={{ ...cardMeta, marginTop: 4 }}>{p.address}</p>}
                    </>
                  );
                  return p.url ? (
                    <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="press-scale" style={card}>
                      {inner}
                    </a>
                  ) : (
                    <div key={p.id} style={card}>{inner}</div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
