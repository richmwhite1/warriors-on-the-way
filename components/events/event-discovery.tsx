"use client";

import { useState } from "react";
import Link from "next/link";
import type { PublicEvent } from "@/lib/queries/events";
import { formatEventDate, formatEventTime, eventDayOfMonth } from "@/lib/event-time";

export function EventDiscovery({ events }: { events: PublicEvent[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.community_name.toLowerCase().includes(q) ||
          (e.location ?? "").toLowerCase().includes(q),
      )
    : events;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events, places, communities…"
        className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          {q ? `No events match "${query}"` : "No public events coming up right now."}
        </p>
      ) : (
        filtered.map((event) => {
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
                    {formatEventDate(event.starts_at, event.timezone, { month: "short" })}
                  </p>
                  <p style={{ fontFamily: "var(--font-brand)", fontSize: 22, fontWeight: 800, color: "var(--foreground)", lineHeight: 1.2 }}>
                    {eventDayOfMonth(event.starts_at, event.timezone)}
                  </p>
                </div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontFamily: "var(--font-brand)", fontWeight: 700, color: "var(--foreground)", fontSize: "0.95rem", lineHeight: 1.3, marginBottom: "0.2rem" }}>
                  {event.title}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                  {startsAt
                    ? formatEventTime(event.starts_at, event.timezone)
                    : "Date TBD"}
                  {event.location && ` · ${event.location}`}
                  {event.going > 0 && ` · ${event.going} going`}
                </p>
                <span style={{ display: "inline-block", marginTop: "0.35rem", fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, color: "var(--primary)", background: "#eef2ea", padding: "0.15rem 0.5rem", borderRadius: "9999px" }}>
                  {event.community_name}
                </span>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
