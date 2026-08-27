"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MissionBadge } from "@/components/needs/mission-badge";
import { FormatBadge } from "@/components/needs/format-badge";
import { OfferingCard } from "@/components/needs/offering-card";
import type {
  GatheringFormat,
  NeedCommunity,
  NeedEvent,
  NeedOffering,
  NeedPractitioner,
} from "@/lib/queries/needs";

// Dates are formatted on the server and passed down as strings: this component is
// client-side, and formatting a date in the browser after the server already rendered
// one produces a hydration mismatch the moment the two disagree about the timezone.
export type WeekCard = {
  id: string;
  href: string;
  title: string;
  whenLabel: string;
  community_name: string;
  format: GatheringFormat;
};

type FormatFilter = "all" | "in_person" | "online";

const FILTERS: { key: FormatFilter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "in_person", label: "In person" },
  { key: "online", label: "Online" },
];

// A hybrid gathering is a true answer to both "in person" and "online" — filtering it
// out of either would hide the option the person is actually looking for.
function matchesFormat(f: GatheringFormat, filter: FormatFilter): boolean {
  if (filter === "all") return true;
  if (f === "hybrid") return true;
  return f === filter;
}

function matchesQuery(q: string, ...fields: (string | null | undefined)[]): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

const sectionTitle =
  "mt-7 mb-3 font-heading text-[0.95rem] font-extrabold tracking-[0.02em] text-foreground";
const cardBase =
  "press-scale block rounded-[18px] border border-border bg-card px-[18px] py-4 no-underline";
const cardTitle = "mt-2 font-heading text-[1.1rem] font-bold leading-[1.25] text-foreground";
const cardMeta = "mt-1.5 font-sans text-[13px] text-muted-foreground";

// Everything behind one doorway, with the two things a stacked list can't do on its
// own: say what's happening soon, and let you narrow it down.
//
// The sections below are ordered by *type* — circles, offerings, gatherings, people —
// which is the shape of the data, not the shape of the question. Someone standing here
// on a Thursday wants to know what they can walk into this weekend, so that answer goes
// first and the taxonomy goes second.
export function Doorway({
  circles,
  offerings,
  events,
  practitioners,
  week,
  eventDates,
}: {
  circles: NeedCommunity[];
  offerings: NeedOffering[];
  events: NeedEvent[];
  practitioners: NeedPractitioner[];
  week: WeekCard[];
  /** Pre-formatted event dates, keyed by event id — see WeekCard on why. */
  eventDates: Record<string, string>;
}) {
  const [format, setFormat] = useState<FormatFilter>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return {
      circles: circles.filter(
        (c) => matchesFormat(c.format, format) && matchesQuery(q, c.name, c.purpose, c.description),
      ),
      offerings: offerings.filter(
        (o) =>
          matchesFormat(o.format, format) &&
          matchesQuery(q, o.title, o.description, o.facilitator_name, o.location),
      ),
      events: events.filter(
        (e) => matchesFormat(e.format, format) && matchesQuery(q, e.title, e.community_name),
      ),
      // Practitioners have no format — a person isn't a venue — so only search narrows them.
      practitioners: practitioners.filter((p) => matchesQuery(q, p.title, p.description)),
    };
  }, [circles, offerings, events, practitioners, format, q]);

  const total =
    circles.length + offerings.length + events.length + practitioners.length;
  const shown =
    filtered.circles.length +
    filtered.offerings.length +
    filtered.events.length +
    filtered.practitioners.length;

  // Filters on four items are furniture, not help. They earn their space once the
  // doorway is busy enough that scanning it is real work.
  const showFilters = total >= 6;

  return (
    <div className="px-4">
      {/* ── This week ──────────────────────────────────────────────────────── */}
      {week.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 font-heading text-[0.95rem] font-extrabold tracking-[0.02em] text-foreground">
            This week
          </h2>
          {/* Horizontal on purpose: it's a glance, not a list to work through, and it
              must not push the fuller answer below it off the screen. */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
            {week.map((w) => (
              <Link
                key={`${w.href}-${w.id}`}
                href={w.href}
                className="press-scale w-[240px] flex-none snap-start rounded-[18px] border border-primary/25 bg-primary/[0.06] px-4 py-3.5 no-underline"
              >
                <p className="font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  {w.whenLabel}
                </p>
                <p className="mt-1.5 font-heading text-base font-bold leading-tight text-foreground">
                  {w.title}
                </p>
                <p className="mt-1 font-sans text-[12.5px] text-muted-foreground">
                  {w.community_name}
                </p>
                <div className="mt-2">
                  <FormatBadge format={w.format} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Narrowing ──────────────────────────────────────────────────────── */}
      {showFilters && (
        <div className="mt-7 space-y-2.5">
          <label className="sr-only" htmlFor="doorway-search">
            Search this doorway
          </label>
          <input
            id="doorway-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, facilitator, place…"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-sans text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by format">
            {FILTERS.map((f) => {
              const on = format === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFormat(f.key)}
                  aria-pressed={on}
                  className={`rounded-full border px-3.5 py-1.5 font-sans text-[13px] font-medium transition-colors ${
                    on
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Narrowing to nothing is a dead end of the person's own making — so say what
          would fix it rather than showing them a blank page. */}
      {shown === 0 && total > 0 && (
        <div className="mt-7 rounded-2xl border border-border bg-card p-5">
          <p className="font-heading text-base font-bold text-foreground">Nothing matches that</p>
          <p className="mt-1.5 font-sans text-sm leading-relaxed text-muted-foreground">
            There are {total} things behind this doorway — try a different word, or widen
            the filter back to everything.
          </p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setFormat("all");
            }}
            className="press-scale mt-3.5 rounded-full border border-border bg-background px-4 py-2 font-heading text-[13px] font-bold text-foreground"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Circles to join ────────────────────────────────────────────────── */}
      {filtered.circles.length > 0 && (
        <>
          <h2 className={sectionTitle}>Circles to join</h2>
          {/* First meeting with the word, for anyone who came straight here from a
              shared link and skipped the front door. */}
          <p className="-mt-1 mb-2.5 font-sans text-[13px] leading-snug text-muted-foreground">
            Small groups that meet regularly, in person.
          </p>
          <div className="grid gap-2.5">
            {filtered.circles.map((c) => (
              <Link key={c.id} href={`/community/${c.slug}`} className={cardBase}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-heading text-[1.1rem] font-bold leading-[1.25] text-foreground">
                    {c.name}
                  </p>
                  {c.is_forming && (
                    <span className="rounded-full bg-primary/10 px-2 py-[3px] font-heading text-[10.5px] font-bold uppercase tracking-[0.06em] text-primary">
                      Just forming
                    </span>
                  )}
                  <FormatBadge format={c.format} />
                </div>
                {(c.purpose ?? c.description) && (
                  <p className={cardMeta}>{c.purpose ?? c.description}</p>
                )}
                <p className={cardMeta}>
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

      {/* ── Ongoing offerings ──────────────────────────────────────────────── */}
      {filtered.offerings.length > 0 && (
        <>
          <h2 className={sectionTitle}>Ongoing offerings</h2>
          <p className="-mt-1 mb-2.5 font-sans text-[13px] leading-snug text-muted-foreground">
            Things people here run on a regular rhythm — always free to attend.
          </p>
          <div className="grid gap-2.5">
            {filtered.offerings.map((o) => (
              <OfferingCard key={o.id} offering={o} showCommunity />
            ))}
          </div>
        </>
      )}

      {/* ── Upcoming gatherings (one-off events) ───────────────────────────── */}
      {filtered.events.length > 0 && (
        <>
          <h2 className={sectionTitle}>Upcoming gatherings</h2>
          <div className="grid gap-2.5">
            {filtered.events.map((e) => (
              <Link
                key={e.id}
                href={`/community/${e.community_slug}/events/${e.id}`}
                className={cardBase}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <MissionBadge mission={e.mission} />
                  <FormatBadge format={e.format} />
                </div>
                <p className={cardTitle}>{e.title}</p>
                <p className={cardMeta}>
                  {eventDates[e.id] ?? "Date TBD"} · {e.community_name}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── People & practitioners ─────────────────────────────────────────── */}
      {filtered.practitioners.length > 0 && (
        <>
          <h2 className={sectionTitle}>People &amp; practitioners</h2>
          <div className="grid gap-2.5">
            {filtered.practitioners.map((p) => {
              const inner = (
                <>
                  <MissionBadge mission={p.mission} />
                  <p className={cardTitle}>{p.title}</p>
                  {p.description && <p className={cardMeta}>{p.description}</p>}
                  {p.address && <p className={cardMeta}>{p.address}</p>}
                </>
              );
              return p.url ? (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardBase}
                >
                  {inner}
                </a>
              ) : (
                <div key={p.id} className={cardBase.replace("press-scale ", "")}>
                  {inner}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
