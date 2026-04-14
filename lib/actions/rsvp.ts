"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/actions/notifications";
import { rebalanceGroupExpensesForNewAttendee } from "@/lib/actions/event-modules";

export async function upsertRsvp(
  eventId: string,
  status: "yes" | "no" | "maybe",
  guests: number,
  communitySlug: string,
  paymentSent?: boolean   // true when the user explicitly clicked through the fee gate
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const row: Record<string, unknown> = { event_id: eventId, user_id: user.id, status, guests };
  if (paymentSent) row.payment_status = "sent";

  const { error } = await supabase.from("rsvps").upsert(row, { onConflict: "event_id,user_id" });

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);

  // Auto-rebalance any group-split expenses when a new attendee says yes
  if (status === "yes") {
    await rebalanceGroupExpensesForNewAttendee(eventId, user.id, communitySlug).catch(() => {
      // best-effort — don't fail the RSVP
    });

    // Notify all group expense members who are missing a Venmo handle
    try {
      const admin = createAdminClient();
      const { data: groupExpenses } = await admin
        .from("event_expenses")
        .select("id, paid_by, splits:expense_splits(user_id)")
        .eq("event_id", eventId)
        .eq("is_group_split", true);

      if (groupExpenses?.length) {
        const userIds = new Set<string>();
        for (const exp of groupExpenses) {
          userIds.add(exp.paid_by as string);
          const splits = exp.splits as { user_id: string }[];
          splits.forEach((s) => userIds.add(s.user_id));
        }

        const { data: expenseUsers } = await admin
          .from("users")
          .select("id, venmo_handle")
          .in("id", [...userIds]);

        const missing = expenseUsers?.filter((u) => !u.venmo_handle) ?? [];
        await Promise.allSettled(
          missing.map((u) =>
            createNotification(u.id, "add_venmo", {
              event_id: eventId,
              community_slug: communitySlug,
            })
          )
        );
      }
    } catch {
      // best-effort
    }
  }

  // Notify event organizer when someone RSVPs yes (best-effort)
  if (status === "yes") {
    try {
      const admin = createAdminClient();
      const { data: event } = await admin
        .from("events")
        .select("created_by, title")
        .eq("id", eventId)
        .single();

      if (event && event.created_by !== user.id) {
        const { data: rsvpUser } = await admin
          .from("users")
          .select("display_name")
          .eq("id", user.id)
          .single();

        await createNotification(event.created_by, "rsvp_created", {
          actor_name: (rsvpUser as { display_name?: string } | null)?.display_name ?? "Someone",
          event_title: (event as { title?: string }).title ?? "your event",
          event_id: eventId,
          community_slug: communitySlug,
        });
      }
    } catch {
      // best-effort
    }
  }
}

export async function castDateVote(
  optionId: string,
  eventId: string,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("event_date_votes").upsert(
    { option_id: optionId, user_id: user.id },
    { onConflict: "option_id,user_id" }
  );

  // Check if threshold reached — auto-lock
  const { data: event } = await supabase
    .from("events")
    .select("vote_threshold, community_id")
    .eq("id", eventId)
    .single();

  if (event) {
    const { count: memberCount } = await supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("community_id", event.community_id)
      .eq("status", "active");

    const { count: voteCount } = await supabase
      .from("event_date_votes")
      .select("id", { count: "exact", head: true })
      .eq("option_id", optionId);

    const pct = memberCount && memberCount > 0
      ? Math.round(((voteCount ?? 0) / memberCount) * 100)
      : 0;

    if (pct >= event.vote_threshold) {
      await supabase.from("events").update({
        status: "confirmed",
        starts_at: (await supabase
          .from("event_date_options")
          .select("starts_at, ends_at")
          .eq("id", optionId)
          .single()
        ).data?.starts_at,
      }).eq("id", eventId);
    }
  }

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function submitGuestRsvp(
  eventId: string,
  name: string,
  email: string | null,
  status: "yes" | "maybe" | "no",
  communitySlug: string
) {
  const admin = createAdminClient();

  // Verify the event exists and the community allows guest RSVPs
  const { data: event } = await admin
    .from("events")
    .select("id, community_id, communities!inner(allow_guest_rsvp)")
    .eq("id", eventId)
    .single();

  if (!event) throw new Error("Event not found");

  const community = (event.communities as unknown as { allow_guest_rsvp: boolean | null });
  if (community.allow_guest_rsvp === false) throw new Error("Guest RSVPs are not allowed for this event");

  const { error } = await admin.from("guest_rsvps").insert({
    event_id: eventId,
    name: name.trim(),
    email: email?.trim() || null,
    status,
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function setRsvpPaymentStatus(
  eventId: string,
  targetUserId: string,
  paymentStatus: "unpaid" | "sent" | "confirmed" | "waived",
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("community_id")
    .eq("id", eventId)
    .single();
  if (!event) throw new Error("Event not found");

  const { data: membership } = await admin
    .from("community_members")
    .select("role")
    .eq("community_id", event.community_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["admin", "organizer"].includes(membership.role)) {
    throw new Error("Not authorized");
  }

  const { error } = await admin
    .from("rsvps")
    .update({ payment_status: paymentStatus })
    .eq("event_id", eventId)
    .eq("user_id", targetUserId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function toggleCheckIn(
  eventId: string,
  targetUserId: string,
  checkedIn: boolean,
  communitySlug: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("community_id")
    .eq("id", eventId)
    .single();
  if (!event) throw new Error("Event not found");

  const { data: membership } = await admin
    .from("community_members")
    .select("role")
    .eq("community_id", event.community_id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!membership || !["admin", "organizer"].includes(membership.role)) {
    throw new Error("Not authorized");
  }

  const { error } = await admin
    .from("rsvps")
    .update({ checked_in_at: checkedIn ? new Date().toISOString() : null })
    .eq("event_id", eventId)
    .eq("user_id", targetUserId);
  if (error) throw new Error(error.message);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}

export async function removeDateVote(
  optionId: string,
  communitySlug: string,
  eventId: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("event_date_votes")
    .delete()
    .eq("option_id", optionId)
    .eq("user_id", user.id);

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}
