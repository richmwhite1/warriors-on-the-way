import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Returns the exact address only if the caller is entitled to it (creator, steward,
// or has RSVP'd yes/maybe). The gate lives in the SECURITY DEFINER RPC; direct
// column reads are revoked, so this is the only way to obtain it.
export async function getEventExactAddress(eventId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_exact_address", { p_event_id: eventId });
  return (data as string | null) ?? null;
}

export type EventAttendee = {
  user_id: string;
  status: "yes" | "no" | "maybe";
  guests: number;
  checked_in_at: string | null;
  user: { id: string; display_name: string; avatar_url: string | null };
};

export type EventDateOption = {
  id: string;
  event_id: string;
  starts_at: string;
  ends_at: string | null;
  vote_count?: number;
  user_voted?: boolean;
};

export type EventRow = {
  id: string;
  community_id: string;
  created_by: string;
  title: string;
  description: string | null;
  location: string | null;
  location_url: string | null;
  virtual_url: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  status: "draft" | "voting" | "confirmed" | "cancelled";
  vote_threshold: number;
  tasks_enabled: boolean;
  expenses_enabled: boolean;
  created_at: string;
  // How people join — what the doorway filters narrow on.
  format?: "in_person" | "online" | "hybrid" | null;
  creator: { id: string; display_name: string; avatar_url: string | null; venmo_handle: string | null };
  rsvp_counts?: { yes: number; no: number; maybe: number };
  user_rsvp?: { status: string; guests: number } | null;
  date_options?: EventDateOption[];
};

export async function listEventAttendees(eventId: string): Promise<EventAttendee[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("rsvps")
    .select(`status, guests, user_id, checked_in_at, user:users!user_id(id, display_name, avatar_url)`)
    .eq("event_id", eventId)
    .in("status", ["yes", "maybe"])
    .order("status"); // yes before maybe
  return (data as unknown as EventAttendee[]) ?? [];
}

export type GuestAttendee = {
  id: string;
  name: string;
  status: "yes" | "no" | "maybe";
};

export async function listGuestAttendees(eventId: string): Promise<GuestAttendee[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("guest_rsvps")
    .select("id, name, status")
    .eq("event_id", eventId)
    .in("status", ["yes", "maybe"])
    .order("status");
  return (data as unknown as GuestAttendee[]) ?? [];
}

export async function getNextParentEvent(): Promise<(EventRow & { community_slug: string }) | null> {
  const admin = createAdminClient();

  const { data: parent } = await admin
    .from("communities")
    .select("id, slug")
    .eq("is_parent", true)
    .single();

  if (!parent) return null;

  const { data } = await admin
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, location_url, virtual_url, image_url,
      starts_at, ends_at, timezone, status, vote_threshold, tasks_enabled, expenses_enabled, created_at, format,
      creator:users!created_by(id, display_name, avatar_url, venmo_handle)
    `)
    .eq("community_id", parent.id)
    .eq("status", "confirmed")
    .gt("starts_at", new Date().toISOString())
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(1);

  const event = data?.[0];
  if (!event) return null;
  return { ...(event as unknown as EventRow), community_slug: (parent as { id: string; slug: string }).slug };
}

export async function listCommunityEvents(communityId: string): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, location_url, virtual_url, image_url,
      starts_at, ends_at, timezone, status, vote_threshold, tasks_enabled, expenses_enabled, created_at, format,
      creator:users!created_by(id, display_name, avatar_url, venmo_handle),
      rsvps(status)
    `)
    .eq("community_id", communityId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true, nullsFirst: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((event) => {
    const rsvp_counts = { yes: 0, no: 0, maybe: 0 };
    (event.rsvps ?? []).forEach((r: { status: string }) => {
      if (r.status === "yes") rsvp_counts.yes++;
      else if (r.status === "no") rsvp_counts.no++;
      else if (r.status === "maybe") rsvp_counts.maybe++;
    });
    const { rsvps: _rsvps, ...rest } = event;
    return { ...rest, rsvp_counts } as EventRow;
  });
}

export async function listUpcomingEventsForUser(
  userId: string
): Promise<(EventRow & { community_slug: string; community_name: string })[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId)
    .eq("status", "active");

  if (!memberships?.length) return [];

  const communityIds = memberships.map((m) => m.community_id);
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, location_url, virtual_url, image_url,
      starts_at, ends_at, timezone, status, vote_threshold, tasks_enabled, expenses_enabled, created_at, format,
      creator:users!created_by(id, display_name, avatar_url, venmo_handle),
      community:communities!community_id(slug, name),
      rsvps(status)
    `)
    .in("community_id", communityIds)
    .in("status", ["confirmed", "voting"])
    // A voting event has no starts_at yet (its dates live in event_date_options), so a
    // plain .gt() drops every one of them — silently defeating the "voting" above.
    .or(`starts_at.is.null,starts_at.gt.${now}`)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(4);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((event) => {
    const rsvp_counts = { yes: 0, no: 0, maybe: 0 };
    (event.rsvps ?? []).forEach((r: { status: string }) => {
      if (r.status === "yes") rsvp_counts.yes++;
      else if (r.status === "no") rsvp_counts.no++;
      else if (r.status === "maybe") rsvp_counts.maybe++;
    });
    const { rsvps: _rsvps, community, ...rest } = event;
    return {
      ...rest,
      rsvp_counts,
      community_slug: (community as { slug: string; name: string })?.slug ?? "",
      community_name: (community as { slug: string; name: string })?.name ?? "",
    } as EventRow & { community_slug: string; community_name: string };
  });
}

// Upcoming events across the communities tagged to an objective.
export async function listUpcomingEventsForTopic(
  topicId: string,
  limit = 4
): Promise<(EventRow & { community_slug: string; community_name: string })[]> {
  const supabase = await createClient();

  const { data: tagged } = await supabase
    .from("community_topics")
    .select("community_id")
    .eq("topic_id", topicId);
  const communityIds = (tagged ?? []).map((t: { community_id: string }) => t.community_id);
  if (communityIds.length === 0) return [];

  const now = new Date().toISOString();
  const { data } = await supabase
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, location_url, virtual_url, image_url,
      starts_at, ends_at, timezone, status, vote_threshold, tasks_enabled, expenses_enabled, created_at, format,
      creator:users!created_by(id, display_name, avatar_url, venmo_handle),
      community:communities!community_id(slug, name),
      rsvps(status)
    `)
    .in("community_id", communityIds)
    .in("status", ["confirmed", "voting"])
    // A voting event has no starts_at yet (its dates live in event_date_options), so a
    // plain .gt() drops every one of them — silently defeating the "voting" above.
    .or(`starts_at.is.null,starts_at.gt.${now}`)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? []).map((event) => {
    const rsvp_counts = { yes: 0, no: 0, maybe: 0 };
    (event.rsvps ?? []).forEach((r: { status: string }) => {
      if (r.status === "yes") rsvp_counts.yes++;
      else if (r.status === "no") rsvp_counts.no++;
      else if (r.status === "maybe") rsvp_counts.maybe++;
    });
    const { rsvps: _rsvps, community, ...rest } = event;
    return {
      ...rest,
      rsvp_counts,
      community_slug: (community as { slug: string; name: string })?.slug ?? "",
      community_name: (community as { slug: string; name: string })?.name ?? "",
    } as EventRow & { community_slug: string; community_name: string };
  });
}

/**
 * Fetch event details using the admin client — bypasses RLS.
 * Used for guest/public pages where the viewer is not authenticated.
 */
export async function getEventForGuest(eventId: string): Promise<EventRow | null> {
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, location_url, virtual_url, image_url,
      starts_at, ends_at, timezone, status, vote_threshold, tasks_enabled, expenses_enabled, created_at, format,
      creator:users!created_by(id, display_name, avatar_url, venmo_handle)
    `)
    .eq("id", eventId)
    .is("deleted_at", null)
    .single();

  if (!event) return null;

  // RSVP counts (member + guest combined)
  const [{ data: rsvps }, { data: guestRsvps }] = await Promise.all([
    admin.from("rsvps").select("status").eq("event_id", eventId),
    admin.from("guest_rsvps").select("status").eq("event_id", eventId),
  ]);

  const rsvp_counts = { yes: 0, no: 0, maybe: 0 };
  rsvps?.forEach((r) => {
    if (r.status === "yes") rsvp_counts.yes++;
    else if (r.status === "no") rsvp_counts.no++;
    else if (r.status === "maybe") rsvp_counts.maybe++;
  });
  guestRsvps?.forEach((r) => {
    if (r.status === "yes") rsvp_counts.yes++;
    else if (r.status === "no") rsvp_counts.no++;
    else if (r.status === "maybe") rsvp_counts.maybe++;
  });

  return {
    ...(event as unknown as EventRow),
    rsvp_counts,
    user_rsvp: null,
    date_options: [],
  };
}

export async function getEventWithDetails(eventId: string, userId?: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, location_url, virtual_url, image_url,
      starts_at, ends_at, timezone, status, vote_threshold, tasks_enabled, expenses_enabled, created_at, format,
      creator:users!created_by(id, display_name, avatar_url, venmo_handle)
    `)
    .eq("id", eventId)
    .is("deleted_at", null)
    .single();

  if (!event) return null;

  // Member RSVP counts
  const { data: rsvps } = await admin
    .from("rsvps")
    .select("status")
    .eq("event_id", eventId);

  const rsvp_counts = { yes: 0, no: 0, maybe: 0 };
  rsvps?.forEach((r) => {
    if (r.status === "yes") rsvp_counts.yes++;
    else if (r.status === "no") rsvp_counts.no++;
    else if (r.status === "maybe") rsvp_counts.maybe++;
  });

  // Guest RSVP counts (fold into member counts for unified display)
  const { data: guestRsvps } = await admin
    .from("guest_rsvps")
    .select("status")
    .eq("event_id", eventId);

  guestRsvps?.forEach((r) => {
    if (r.status === "yes") rsvp_counts.yes++;
    else if (r.status === "no") rsvp_counts.no++;
    else if (r.status === "maybe") rsvp_counts.maybe++;
  });

  // User's own RSVP (only when authenticated)
  let userRsvp: { status: string; guests: number } | null = null;
  if (userId) {
    const { data } = await supabase
      .from("rsvps")
      .select("status, guests")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();
    userRsvp = data ?? null;
  }

  // Date options + votes
  const { data: options } = await admin
    .from("event_date_options")
    .select(`id, event_id, starts_at, ends_at, votes:event_date_votes(user_id)`)
    .eq("event_id", eventId)
    .order("starts_at");

  const date_options: EventDateOption[] = (options ?? []).map((o) => ({
    id: o.id,
    event_id: o.event_id,
    starts_at: o.starts_at,
    ends_at: o.ends_at,
    vote_count: (o.votes as { user_id: string }[]).length,
    user_voted: userId
      ? (o.votes as { user_id: string }[]).some((v) => v.user_id === userId)
      : false,
  }));

  return {
    ...(event as unknown as EventRow),
    rsvp_counts,
    user_rsvp: userRsvp,
    date_options,
  };
}

export type PublicEvent = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null; // general location — public-safe (never the exact address)
  image_url: string | null;
  community_slug: string;
  community_name: string;
  going: number;
};

// Upcoming events across browsable (public + listed, or parent) communities — powers
// event discovery. Uses the admin client so we control exactly which fields are
// exposed: only the general location, never the RSVP-gated exact address.
export async function listUpcomingPublicEvents(limit = 60): Promise<PublicEvent[]> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from("events")
    .select(`
      id, title, starts_at, location, image_url, status,
      community:communities!community_id(slug, name, is_private, status, is_parent),
      rsvps(status)
    `)
    .in("status", ["confirmed", "voting"])
    // A voting event has no starts_at yet (its dates live in event_date_options), so a
    // plain .gt() drops every one of them — silently defeating the "voting" above.
    .or(`starts_at.is.null,starts_at.gt.${now}`)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any[]) ?? [])
    .filter((e) => {
      const c = e.community;
      return c && c.is_private === false && (c.status === "listed" || c.is_parent === true);
    })
    .map((e) => ({
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      location: e.location,
      image_url: e.image_url,
      community_slug: e.community.slug,
      community_name: e.community.name,
      going: (e.rsvps ?? []).filter((r: { status: string }) => r.status === "yes").length,
    }));
}
