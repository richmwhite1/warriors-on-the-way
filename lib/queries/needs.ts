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

export type NeedOffering = {
  id: string;
  title: string;
  description: string | null;
  facilitator_name: string | null;
  cadence_text: string | null;
  next_starts_at: string | null;
  location: string | null;
  cost_note: string | null;
  community_slug: string;
  community_name: string;
  mission: MissionBadge;
};

export type NeedEvent = {
  id: string;
  title: string;
  starts_at: string | null;
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

// Standing / recurring programs answering this need (yoga, grief group, potlucks).
export async function listOfferingsForNeed(needId: string): Promise<NeedOffering[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offering_needs")
    .select(`
      offering:offerings!inner(
        id, title, description, facilitator_name, cadence_text, next_starts_at,
        location, cost_note, status, deleted_at,
        community:communities!community_id(slug, name),
        mission:topics!topic_id(slug, name)
      )
    `)
    .eq("need_id", needId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = ((data as any[]) ?? []).map((r) => r.offering).filter(Boolean);
  return rows
    .filter((o) => o.status === "active" && !o.deleted_at)
    .map((o) => ({
      id: o.id,
      title: o.title,
      description: o.description,
      facilitator_name: o.facilitator_name,
      cadence_text: o.cadence_text,
      next_starts_at: o.next_starts_at,
      location: o.location,
      cost_note: o.cost_note,
      community_slug: o.community?.slug ?? "",
      community_name: o.community?.name ?? "",
      mission: missionFrom(o.mission),
    }));
}

// One-off gatherings tagged to this need (BBQ, lake day, hike).
export async function listEventsForNeed(needId: string, limit = 12): Promise<NeedEvent[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("event_needs")
    .select(`
      event:events!inner(
        id, title, starts_at, status, deleted_at,
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
  needs: { slug: string; name: string; icon: string | null }[];
};

// The standing offerings a community runs — shown on the community page so they
// aren't only reachable by whichever doorway they happen to be tagged with.
export async function listOfferingsForCommunity(communityId: string): Promise<NeedOffering[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offerings")
    .select(`
      id, title, description, facilitator_name, cadence_text, next_starts_at,
      location, cost_note,
      community:communities!community_id(slug, name),
      mission:topics!topic_id(slug, name)
    `)
    .eq("community_id", communityId)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    facilitator_name: o.facilitator_name,
    cadence_text: o.cadence_text,
    next_starts_at: o.next_starts_at,
    location: o.location,
    cost_note: o.cost_note,
    community_slug: o.community?.slug ?? "",
    community_name: o.community?.name ?? "",
    mission: missionFrom(o.mission),
  }));
}

export async function getOfferingById(offeringId: string): Promise<Offering | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offerings")
    .select(`
      id, title, description, facilitator_name, cadence_text, next_starts_at,
      location, cost_note, created_by, deleted_at,
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
    id: o.id,
    title: o.title,
    description: o.description,
    facilitator_name: o.facilitator_name,
    cadence_text: o.cadence_text,
    next_starts_at: o.next_starts_at,
    location: o.location,
    cost_note: o.cost_note,
    created_by: o.created_by,
    community_slug: o.community?.slug ?? "",
    community_name: o.community?.name ?? "",
    mission: missionFrom(o.mission),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    needs: ((o.offering_needs as any[]) ?? []).map((r) => r.need).filter(Boolean),
  };
}
