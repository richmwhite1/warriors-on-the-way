import { createClient } from "@/lib/supabase/server";

// Shannon's six felt needs — the navigation spine. Orthogonal to `topics`
// (Seán's nine missions), which ride along as a mission badge on each card.

export type Need = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  prompt: string | null;
  icon: string | null;
  sort_order: number;
};

// A mission badge (Seán's nine) attached to a card, or null when untagged.
export type MissionBadge = { slug: string; name: string } | null;

// Can I actually get there? `location` is free text, so before this an online circle
// looked identical to one meeting across the valley.
export type GatheringFormat = "in_person" | "online" | "hybrid";

export type NeedOffering = {
  id: string;
  title: string;
  description: string | null;
  facilitator_name: string | null;
  cadence_text: string | null;
  next_starts_at: string | null;
  // The zone next_starts_at was entered in — an appointment is read on the clock
  // of the place it happens at, not the viewer's or the server's.
  timezone: string;
  location: string | null;
  cost_note: string | null;
  format: GatheringFormat;
  interest_count: number;
  community_slug: string;
  community_name: string;
  mission: MissionBadge;
};

export type NeedEvent = {
  id: string;
  title: string;
  starts_at: string | null;
  timezone: string;
  format: GatheringFormat;
  community_slug: string;
  community_name: string;
  mission: MissionBadge;
};

export type NeedPractitioner = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string | null;
  address: string | null;
  mission: MissionBadge;
};

export async function getNeeds(): Promise<Need[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("needs")
    .select("id, slug, name, tagline, prompt, icon, sort_order")
    .order("sort_order", { ascending: true });
  return (data as Need[]) ?? [];
}

export async function getNeedBySlug(slug: string): Promise<Need | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("needs")
    .select("id, slug, name, tagline, prompt, icon, sort_order")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Need) ?? null;
}

function missionFrom(topic: { slug: string; name: string } | null | undefined): MissionBadge {
  return topic ? { slug: topic.slug, name: topic.name } : null;
}

// Rows added before the `format` column existed read back as its default, but a row
// fetched through a stale PostgREST schema cache can come back undefined — so coerce
// rather than trust, and fall back to the same default the column carries.
function formatFrom(value: unknown): GatheringFormat {
  return value === "online" || value === "hybrid" ? value : "in_person";
}

// One shape, three call sites (doorway, community page, detail). They drifted before;
// a single mapper is what stops the doorway card from silently lacking a field the
// community card shows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNeedOffering(o: any): NeedOffering {
  return {
    id: o.id,
    title: o.title,
    description: o.description,
    facilitator_name: o.facilitator_name,
    cadence_text: o.cadence_text,
    next_starts_at: o.next_starts_at,
    timezone: o.timezone ?? "America/Denver",
    location: o.location,
    cost_note: o.cost_note,
    format: formatFrom(o.format),
    interest_count: o.interest_count ?? 0,
    community_slug: o.community?.slug ?? "",
    community_name: o.community?.name ?? "",
    mission: missionFrom(o.mission),
  };
}

// Standing / recurring programs answering this need (yoga, grief group, potlucks).
export async function listOfferingsForNeed(needId: string): Promise<NeedOffering[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offering_needs")
    .select(`
      offering:offerings!inner(
        id, title, description, facilitator_name, cadence_text, next_starts_at, timezone,
        location, cost_note, status, deleted_at, format, interest_count,
        community:communities!community_id(slug, name),
        mission:topics!topic_id(slug, name)
      )
    `)
    .eq("need_id", needId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) ?? []).map((r) => r.offering).filter(Boolean);
  return rows
    .filter((o) => o.status === "active" && !o.deleted_at)
    .map(toNeedOffering);
}

// One-off gatherings tagged to this need (BBQ, lake day, hike).
export async function listEventsForNeed(needId: string, limit = 12): Promise<NeedEvent[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("event_needs")
    .select(`
      event:events!inner(
        id, title, starts_at, timezone, status, deleted_at, format,
        community:communities!community_id(slug, name),
        mission:topics!topic_id(slug, name)
      )
    `)
    .eq("need_id", needId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) ?? []).map((r) => r.event).filter(Boolean);
  return rows
    .filter((e) => ["confirmed", "voting"].includes(e.status) && !e.deleted_at && (!e.starts_at || e.starts_at > now))
    .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""))
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      timezone: e.timezone ?? "UTC",
      format: formatFrom(e.format),
      community_slug: e.community?.slug ?? "",
      community_name: e.community?.name ?? "",
      mission: missionFrom(e.mission),
    }));
}

// Practitioners / facilitators in the directory tagged to this need.
export async function listPractitionersForNeed(needId: string): Promise<NeedPractitioner[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resource_needs")
    .select(`
      resource:topic_resources!inner(
        id, title, description, category, url, address, hidden_at,
        mission:topics!topic_id(slug, name)
      )
    `)
    .eq("need_id", needId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) ?? []).map((r) => r.resource).filter(Boolean);
  return rows
    .filter((r) => !r.hidden_at)
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      url: r.url,
      address: r.address,
      mission: missionFrom(r.mission),
    }));
}

// The doorway ids already tagged on an event — powers the edit form's picker so
// re-saving doesn't silently drop tags the organizer set earlier.
export async function getNeedIdsForEvent(eventId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_needs")
    .select("need_id")
    .eq("event_id", eventId);
  return ((data as { need_id: string }[]) ?? []).map((r) => r.need_id);
}

// ── Offerings ──────────────────────────────────────────────────────────────

export type Offering = NeedOffering & {
  description: string | null;
  next_starts_at: string | null;
  created_by: string;
  community_id: string;
  topic_id: string | null;
  status: "active" | "paused" | "ended";
  needs: { slug: string; name: string; icon: string | null }[];
};

// The standing offerings a community runs — shown on the community page so they
// aren't only reachable by whichever doorway they happen to be tagged with.
export async function listOfferingsForCommunity(communityId: string): Promise<NeedOffering[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offerings")
    .select(`
      id, title, description, facilitator_name, cadence_text, next_starts_at, timezone,
      location, cost_note, format, interest_count,
      community:communities!community_id(slug, name),
      mission:topics!topic_id(slug, name)
    `)
    .eq("community_id", communityId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map(toNeedOffering);
}

export async function getOfferingById(offeringId: string): Promise<Offering | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offerings")
    .select(`
      id, title, description, facilitator_name, cadence_text, next_starts_at, timezone,
      location, cost_note, created_by, deleted_at, status, format, interest_count,
      community_id, topic_id,
      community:communities!community_id(slug, name),
      mission:topics!topic_id(slug, name),
      offering_needs(need:needs!need_id(slug, name, icon))
    `)
    .eq("id", offeringId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o = data as any;
  if (!o || o.deleted_at) return null;
  return {
    ...toNeedOffering(o),
    created_by: o.created_by,
    community_id: o.community_id,
    topic_id: o.topic_id,
    status: o.status ?? "active",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    needs: ((o.offering_needs as any[]) ?? []).map((r) => r.need).filter(Boolean),
  };
}

// ── Interest ("I'm coming") ────────────────────────────────────────────────

// Whether *you* are counted in. The public headcount rides on the offering row
// (interest_count) so a guest sees the number without the roster ever loading.
export async function isInterestedInOffering(offeringId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("offering_interest")
    .select("offering_id")
    .eq("offering_id", offeringId)
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}

// ── This week ──────────────────────────────────────────────────────────────

export type WeekItem = {
  kind: "offering" | "event";
  id: string;
  href: string;
  title: string;
  when: string;           // ISO
  timezone: string;       // the zone `when` should be read in
  community_name: string;
  format: GatheringFormat;
};

// What is actually happening in the next seven days behind this doorway.
//
// The doorway sections are ordered by *type* — circles, offerings, gatherings, people —
// which is how the data is shaped, not how the question is asked. Someone standing at
// "I Want Community" on a Thursday wants to know what they can walk into this weekend,
// and previously had to assemble that from three separate lists sorted three ways.
export function thisWeek(offerings: NeedOffering[], events: NeedEvent[]): WeekItem[] {
  const now = Date.now();
  const horizon = now + 7 * 24 * 60 * 60 * 1000;

  const items: WeekItem[] = [];

  for (const o of offerings) {
    if (!o.next_starts_at) continue; // recurring but no dated session — nothing to promise
    const t = new Date(o.next_starts_at).getTime();
    if (t < now || t > horizon) continue;
    items.push({
      kind: "offering",
      id: o.id,
      href: `/offerings/${o.id}`,
      title: o.title,
      when: o.next_starts_at,
      timezone: o.timezone,
      community_name: o.community_name,
      format: o.format,
    });
  }

  for (const e of events) {
    if (!e.starts_at) continue; // still being voted on — no date to stand behind yet
    const t = new Date(e.starts_at).getTime();
    if (t < now || t > horizon) continue;
    items.push({
      kind: "event",
      id: e.id,
      href: `/community/${e.community_slug}/events/${e.id}`,
      title: e.title,
      when: e.starts_at,
      timezone: e.timezone,
      community_name: e.community_name,
      format: e.format,
    });
  }

  return items.sort((a, b) => a.when.localeCompare(b.when));
}

// ── What a person needs ────────────────────────────────────────────────────

// Private to the reader — RLS on user_needs means this can only ever return your own.
export async function getMyNeedIds(): Promise<string[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("user_needs").select("need_id").eq("user_id", user.id);
  return ((data as { need_id: string }[]) ?? []).map((r) => r.need_id);
}

// The doorway ids already tagged on an offering — powers the edit form's picker so
// re-saving doesn't silently drop tags the steward set earlier.
export async function getNeedIdsForOffering(offeringId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offering_needs")
    .select("need_id")
    .eq("offering_id", offeringId);
  return ((data as { need_id: string }[]) ?? []).map((r) => r.need_id);
}

// ── Communities by doorway ─────────────────────────────────────────────────

export type NeedCommunity = {
  id: string;
  slug: string;
  name: string;
  purpose: string | null;
  description: string | null;
  location: string | null;
  member_count: number;
  is_forming: boolean;
  format: GatheringFormat;
};

// The circles answering a felt need — the missing middle of the menu. Offerings and
// gatherings tell you what's happening; this is the thing you actually join, and a
// member hears about everything afterwards while a browser hears about nothing.
//
// Forming communities (under the 5-member visibility gate) are included here, unlike
// general browse. On a doorway a forming circle is often the *only* honest answer, and
// someone who just said "I need support" is better served by a three-person circle
// finding its feet than by an empty page. They're flagged so the UI can say so plainly.
// Private communities stay out entirely — those are invite-only by definition.
export async function listCommunitiesForNeed(needId: string): Promise<NeedCommunity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_needs")
    .select(`
      community:communities!community_id(
        id, slug, name, purpose, description, location, format,
        public_member_count, status, is_private, is_parent
      )
    `)
    .eq("need_id", needId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? [])
    .map((r) => r.community)
    .filter((c) => c && c.is_private === false && c.status !== "dormant")
    .map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      purpose: c.purpose,
      description: c.description,
      location: c.location,
      member_count: c.public_member_count ?? 0,
      is_forming: c.status === "forming" && !c.is_parent,
      format: formatFrom(c.format),
    }))
    // Established circles first, then the ones still gathering their first few.
    .sort((a, b) =>
      Number(a.is_forming) - Number(b.is_forming) || b.member_count - a.member_count
    );
}

// The doorway ids already tagged on a community — powers the settings picker.
export async function getNeedIdsForCommunity(communityId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_needs")
    .select("need_id")
    .eq("community_id", communityId);
  return ((data as { need_id: string }[]) ?? []).map((r) => r.need_id);
}

// ── The menu's door signals ────────────────────────────────────────────────

export type NeedSignal = Need & {
  circles: number;
  offerings: number;
  events: number;
  /** ISO date of the soonest dated thing behind this doorway, if any. */
  next_at: string | null;
  /** The zone next_at should be read in — the gathering's, not the viewer's. */
  next_tz: string;
};

// The six doors used to look identically promising, so choosing between them was a
// coin flip — and a wrong flip landed on "nobody's opened this door yet". A person who
// came here because life feels heavy does not have a second guess in them.
//
// This puts the honest state on the front of each door before it's opened: what's
// behind it, and when the next thing is. The busy doors advertise themselves, and the
// quiet ones read as an invitation to found rather than a dead end discovered too late.
//
// Three queries for all six doorways rather than three per doorway — the aggregation is
// in JS on purpose, since PostgREST can't group and the row counts here are small.
export async function getNeedsWithSignal(): Promise<NeedSignal[]> {
  const supabase = await createClient();
  const needs = await getNeeds();
  const now = new Date().toISOString();

  const [circleRows, offeringRows, eventRows] = await Promise.all([
    supabase
      .from("community_needs")
      .select("need_id, community:communities!community_id(status, is_private)"),
    supabase
      .from("offering_needs")
      .select("need_id, offering:offerings!inner(status, deleted_at, next_starts_at, timezone)"),
    supabase
      .from("event_needs")
      .select("need_id, event:events!inner(status, deleted_at, starts_at, timezone)"),
  ]);

  const signal = new Map<
    string,
    { circles: number; offerings: number; events: number; next_at: string | null; next_tz: string }
  >();
  for (const n of needs)
    signal.set(n.id, { circles: 0, offerings: 0, events: 0, next_at: null, next_tz: "UTC" });

  // The soonest thing's own timezone travels with it: "next tomorrow" is a date change
  // on the gathering's calendar, and the front door can't say that without the zone.
  const soonest = (needId: string, when: string | null, timezone: string | null) => {
    if (!when || when < now) return;
    const s = signal.get(needId);
    if (!s) return;
    if (!s.next_at || when < s.next_at) {
      s.next_at = when;
      s.next_tz = timezone || "UTC";
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of ((circleRows.data as any[]) ?? [])) {
    const c = r.community;
    // Same visibility rule as the doorway list: private circles are invite-only, and a
    // dormant one is not something to send a person toward.
    if (!c || c.is_private !== false || c.status === "dormant") continue;
    const s = signal.get(r.need_id);
    if (s) s.circles += 1;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of ((offeringRows.data as any[]) ?? [])) {
    const o = r.offering;
    if (!o || o.status !== "active" || o.deleted_at) continue;
    const s = signal.get(r.need_id);
    if (s) s.offerings += 1;
    soonest(r.need_id, o.next_starts_at, o.timezone);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of ((eventRows.data as any[]) ?? [])) {
    const e = r.event;
    if (!e || e.deleted_at || !["confirmed", "voting"].includes(e.status)) continue;
    if (e.starts_at && e.starts_at < now) continue;
    const s = signal.get(r.need_id);
    if (s) s.events += 1;
    soonest(r.need_id, e.starts_at, e.timezone);
  }

  return needs.map((n) => ({
    ...n,
    ...(signal.get(n.id) ?? { circles: 0, offerings: 0, events: 0, next_at: null, next_tz: "UTC" }),
  }));
}
