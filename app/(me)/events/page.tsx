import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { requireUserProfile } from "@/lib/queries/users";
import { listUpcomingEventsForUser, listUpcomingPublicEvents } from "@/lib/queries/events";
import { EventDiscovery } from "@/components/events/event-discovery";

export default async function EventsPage() {
  const user = await requireUserProfile().catch(() => null);
  if (!user) redirect("/sign-in");

  const [events, publicEvents] = await Promise.all([
    listUpcomingEventsForUser(user.id),
    listUpcomingPublicEvents(),
  ]);
  // Don't repeat a user's own community events in the discovery list below.
  const myEventIds = new Set(events.map((e) => e.id));
  const discoverEvents = publicEvents.filter((e) => !myEventIds.has(e.id));

  return (
    <>
      <AppNav />
      <main className="animate-page-enter" style={{ maxWidth: 480, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      <h1
        style={{
          fontFamily: "var(--font-brand)",
          fontWeight: 800,
          fontSize: "1.75rem",
          letterSpacing: "-0.02em",
          color: "var(--foreground)",
          margin: "0 0 1rem",
        }}
      >
        Events
      </h1>

      {events.length === 0 ? (
        <div style={{ border: "2px dashed var(--border)", borderRadius: "1rem", padding: "2.5rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>
            Nothing on the calendar yet
          </p>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--muted-foreground)", fontSize: 14 }}>
            Events from your communities will show up here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {events.map((event) => {
            const startsAt = event.starts_at ? new Date(event.starts_at) : null;
            return (
              <Link
                key={event.id}
                href={`/community/${event.community_slug}/events/${event.id}`}
                className="press-scale"
                style={{
                  display: "flex",
                  gap: "0.85rem",
                  alignItems: "flex-start",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "1rem",
                  padding: "0.9rem 1rem",
                  textDecoration: "none",
                }}
              >
                {startsAt && (
                  <div style={{ flexShrink: 0, width: 52, textAlign: "center", background: "#eef2ea", borderRadius: "0.75rem", padding: "0.5rem 0.25rem" }}>
                    <p style={{ fontFamily: "var(--font-brand)", fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", lineHeight: 1 }}>
                      {startsAt.toLocaleDateString("en-US", { month: "short" })}
                    </p>
                    <p style={{ fontFamily: "var(--font-brand)", fontSize: 22, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2 }}>
                      {startsAt.getDate()}
                    </p>
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "var(--foreground)", fontSize: "0.95rem", lineHeight: 1.3, marginBottom: "0.2rem" }}>
                    {event.title}
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                    {startsAt
                      ? startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : "Date TBD"}
                    {event.location && ` · ${event.location}`}
                  </p>
                  <span style={{ display: "inline-block", marginTop: "0.35rem", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--primary)", background: "#eef2ea", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                    {event.community_name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Discover — upcoming events from browsable communities across the movement */}
      {discoverEvents.length > 0 && (
        <section style={{ marginTop: "2.25rem" }}>
          <h2
            style={{
              fontFamily: "var(--font-brand)",
              fontWeight: 800,
              fontSize: "1.15rem",
              letterSpacing: "-0.01em",
              color: "var(--foreground)",
              margin: "0 0 0.85rem",
            }}
          >
            Discover events
          </h2>
          <EventDiscovery events={discoverEvents} />
        </section>
      )}
      </main>
    </>
  );
}
