import { createClient } from "@/lib/supabase/server";

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
  virtual_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  timezone: string;
  status: "draft" | "voting" | "confirmed" | "cancelled";
  vote_threshold: number;
  created_at: string;
  creator: { id: string; display_name: string; avatar_url: string | null };
  rsvp_counts?: { yes: number; no: number; maybe: number };
  user_rsvp?: { status: string; guests: number } | null;
  date_options?: EventDateOption[];
};

export async function listCommunityEvents(communityId: string): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, virtual_url,
      starts_at, ends_at, timezone, status, vote_threshold, created_at,
      creator:users!created_by(id, display_name, avatar_url)
    `)
    .eq("community_id", communityId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true, nullsFirst: false });
  return (data as unknown as EventRow[]) ?? [];
}

export async function getEventWithDetails(eventId: string, userId: string): Promise<EventRow | null> {
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select(`
      id, community_id, created_by, title, description, location, virtual_url,
      starts_at, ends_at, timezone, status, vote_threshold, created_at,
      creator:users!created_by(id, display_name, avatar_url)
    `)
    .eq("id", eventId)
    .is("deleted_at", null)
    .single();

  if (!event) return null;

  // RSVP counts
  const { data: rsvps } = await supabase
    .from("rsvps")
    .select("status")
    .eq("event_id", eventId);

  const rsvp_counts = { yes: 0, no: 0, maybe: 0 };
  rsvps?.forEach((r) => {
    if (r.status === "yes") rsvp_counts.yes++;
    else if (r.status === "no") rsvp_counts.no++;
    else if (r.status === "maybe") rsvp_counts.maybe++;
  });

  // User's own RSVP
  const { data: userRsvp } = await supabase
    .from("rsvps")
    .select("status, guests")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .single();

  // Date options + votes
  const { data: options } = await supabase
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
    user_voted: (o.votes as { user_id: string }[]).some((v) => v.user_id === userId),
  }));

  return {
    ...(event as unknown as EventRow),
    rsvp_counts,
    user_rsvp: userRsvp ?? null,
    date_options,
  };
}
