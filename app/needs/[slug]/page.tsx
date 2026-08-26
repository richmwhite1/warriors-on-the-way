import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNeedBySlug,
  listOfferingsForNeed,
  listEventsForNeed,
  listPractitionersForNeed,
  listCommunitiesForNeed,
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

  const [circles, offerings, events, practitioners] = await Promise.all([
    listCommunitiesForNeed(need.id),
    listOfferingsForNeed(need.id),
    listEventsForNeed(need.id),
    listPractitionersForNeed(need.id),
  ]);

  const empty =
    circles.length === 0 && offerings.length === 0 && events.length === 0 && practitioners.length === 0;

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
          {/* An empty doorway is the highest-intent moment in the app — someone has just
              said exactly what they need. Spending it on "nothing here yet" wastes it, so
              the ask is to start the thing they were looking for. */}
          {empty && (
            <div
              style={{
                marginTop: "1.75rem",
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "1.5rem 1.35rem",
              }}
            >
              <p style={{ fontFamily: "var(--font-brand)", fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25, color: "var(--foreground)", margin: 0 }}>
                Nobody&rsquo;s opened this door yet
              </p>
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14.5, color: "var(--muted-foreground)", lineHeight: 1.6, margin: "8px 0 0" }}>
                There&rsquo;s no circle for {need.name.toLowerCase()} near you yet. If you&rsquo;re
                looking for one, chances are somebody nearby is too — starting it is how it begins.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "1.15rem" }}>
                <Link
                  href={`/community/new?need=${need.slug}`}
                  className="press-scale"
                  style={{
                    fontFamily: "var(--font-brand)", fontSize: 14, fontWeight: 700,
                    color: "#ffffff", background: "var(--primary)", borderRadius: 9999,
                    padding: "10px 20px", textDecoration: "none",
                  }}
                >
                  Start a circle
                </Link>
                <Link
                  href="/community"
                  className="press-scale"
                  style={{
                    fontFamily: "var(--font-brand)", fontSize: 14, fontWeight: 700,
                    color: "var(--foreground)", background: "transparent",
                    border: "1px solid var(--border)", borderRadius: 9999,
                    padding: "10px 20px", textDecoration: "none",
                  }}
                >
                  Browse all communities
                </Link>
              </div>
            </div>
          )}

          {/* ── Circles to join ──────────────────────────────────────────────── */}
          {circles.length > 0 && (
            <>
              <h2 style={sectionTitle}>Circles to join</h2>
              <div style={{ display: "grid", gap: 10 }}>
                {circles.map((c) => (
                  <Link key={c.id} href={`/community/${c.slug}`} className="press-scale" style={card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <p style={{ ...cardTitle, margin: 0 }}>{c.name}</p>
                      {c.is_forming && (
                        <span
                          style={{
                            fontFamily: "var(--font-brand)", fontSize: 10.5, fontWeight: 700,
                            letterSpacing: "0.06em", textTransform: "uppercase",
                            color: "var(--primary)",
                            background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                            borderRadius: 9999, padding: "3px 8px",
                          }}
                        >
                          Just forming
                        </span>
                      )}
                    </div>
                    {(c.purpose ?? c.description) && (
                      <p style={{ ...cardMeta, marginTop: 5 }}>{c.purpose ?? c.description}</p>
                    )}
                    <p style={{ ...cardMeta, marginTop: 4 }}>
                      {[
                        c.location,
                        c.is_forming
                          ? `${c.member_count} so far — be one of the first`
                          : `${c.member_count} member${c.member_count === 1 ? "" : "s"}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </Link>
                ))}
              </div>
            </>
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
