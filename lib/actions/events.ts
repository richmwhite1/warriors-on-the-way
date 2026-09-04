"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
// redirect is used by updateEvent (not createEvent — createEvent returns the URL)
import { createClient } from "@/lib/supabase/server";

// in_person / online / hybrid. Unrecognised values fall back to the column default.
function readFormat(formData: FormData): "in_person" | "online" | "hybrid" {
  const raw = formData.get("format") as string;
  return raw === "online" || raw === "hybrid" ? raw : "in_person";
}
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMapUrl } from "@/lib/maps-server";
import { sendEventNotification } from "@/lib/integrations/telegram";
import { sendEventAnnouncements } from "@/lib/integrations/email";
import { notifyCommunityMembers } from "@/lib/actions/notifications";

export async function createEvent(formData: FormData): Promise<{ eventId: string; communitySlug: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const community_id = formData.get("community_id") as string;
  // community_slug is passed from the form so redirect never depends on a DB lookup
  const community_slug_from_form = (formData.get("community_slug") as string) || "";
  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  // The exact address is stored in exact_address (column-revoked; revealed only via
  // the event_exact_address RPC after RSVP). general_location is shown to everyone.
  const exact_address = (formData.get("location") as string)?.trim() || null;
  const general_location = (formData.get("general_location") as string)?.trim() || null;
  // Hosts paste the share link the Maps app gives them; expand it now so the
  // stored URL is one an iPhone can actually open. See lib/maps-server.ts.
  const location_url = await resolveMapUrl(formData.get("location_url") as string);
  const virtual_url = (formData.get("virtual_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const timezone = (formData.get("timezone") as string) || "UTC";
  const mode = formData.get("mode") as string; // "confirmed" | "voting"
  const vote_threshold = parseInt(formData.get("vote_threshold") as string) || 75;
  const tasks_enabled = formData.get("tasks_enabled") === "true";
  const expenses_enabled = formData.get("expenses_enabled") === "true";

  if (!title) throw new Error("Title is required");

  let starts_at: string | null = null;
  let ends_at: string | null = null;
  let status: "confirmed" | "voting" = "confirmed";

  if (mode === "voting") {
    status = "voting";
  } else {
    const dateStr = formData.get("starts_at") as string;
    const endsStr = formData.get("ends_at") as string;
    if (dateStr) starts_at = new Date(dateStr).toISOString();
    if (endsStr) ends_at = new Date(endsStr).toISOString();
  }

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      community_id, created_by: user.id, title, description,
      location: general_location, general_location, exact_address, location_url, virtual_url,
      format: readFormat(formData),
      image_url, timezone, starts_at, ends_at, status, vote_threshold,
      tasks_enabled,
      expenses_enabled,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  // ── Doorway tags (Shannon's six needs) ───────────────────────────────────
  // Without these the event exists only inside its community; these are what put
  // it on /needs/<slug>, which is how someone arriving by felt need ever finds it.
  const need_ids = (formData.getAll("need_ids") as string[]).filter(Boolean);
  if (need_ids.length > 0) {
    await supabase
      .from("event_needs")
      .insert(need_ids.map((need_id) => ({ event_id: event.id, need_id })));
    revalidatePath("/needs", "layout");
  }

  // Add voting date options if provided
  if (mode === "voting") {
    const optionDates = (formData.getAll("option_starts_at") as string[]).filter(Boolean);
    const optionEnds = (formData.getAll("option_ends_at") as string[]);
    if (optionDates.length > 0) {
      await supabase.from("event_date_options").insert(
        optionDates.map((d, i) => ({
          event_id: event.id,
          starts_at: new Date(d).toISOString(),
          ends_at: optionEnds[i] ? new Date(optionEnds[i]).toISOString() : null,
        }))
      );
    }
  }

  // Get community slug + Telegram chat ID for redirect + notification
  const admin = createAdminClient();
  const { data: community } = await admin
    .from("communities")
    .select("slug, name, telegram_chat_id")
    .eq("id", community_id)
    .single();

  const communityData = community as {
    slug: string;
    name: string;
    telegram_chat_id?: string | null;
  } | null;

  // ── Telegram notification ────────────────────────────────────────────────
  if (communityData?.telegram_chat_id) {
    await sendEventNotification(communityData.telegram_chat_id, {
      communityName: communityData.name,
      communitySlug: communityData.slug,
      eventId: event.id,
      title,
      location: general_location,
      startsAt: starts_at,
      timezone,
    }).catch(() => {
      // Don't block redirect if Telegram is unreachable
    });
  }
  // ── In-app notifications ─────────────────────────────────────────────────
  if (communityData) {
    await notifyCommunityMembers(community_id, "event_created", {
      event_id: event.id,
      title,
      community_slug: communityData.slug,
      community_name: communityData.name,
    }, user.id);
  }

  // ── Email announcement to community members ──────────────────────────────
  // In-app notifications only reach people who open the app; email is the
  // announcement channel that actually tells members a gathering exists.
  if (communityData) {
    try {
      const { data: members } = await admin
        .from("community_members")
        .select("user_id, users!inner(display_name, notify_email)")
        .eq("community_id", community_id)
        .eq("status", "active")
        .neq("user_id", user.id);

      const optedIn = (members ?? []).filter((m) => {
        const u = m.users as unknown as { notify_email: boolean };
        return u.notify_email !== false;
      });

      const authUsers = await Promise.all(
        optedIn.map((m) => admin.auth.admin.getUserById(m.user_id).catch(() => null))
      );

      const recipients = optedIn.flatMap((m, i) => {
        const email = authUsers[i]?.data?.user?.email;
        if (!email) return [];
        const u = m.users as unknown as { display_name: string };
        return [{ email, name: u.display_name }];
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
      const dateLine = starts_at
        ? new Date(starts_at).toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric",
            hour: "numeric", minute: "2-digit", timeZone: timezone,
          })
        : "Date being decided — cast your vote";

      await sendEventAnnouncements({
        recipients,
        communityName: communityData.name,
        eventTitle: title,
        description,
        dateLine,
        location: general_location,
        eventUrl: `${siteUrl}/community/${communityData.slug}/events/${event.id}`,
      });
    } catch {
      // best-effort — never block event creation on email delivery
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  // Use slug from form first (always available), fall back to DB lookup
  const finalSlug = communityData?.slug || community_slug_from_form;
  return { eventId: event.id, communitySlug: finalSlug };
}

export async function updateEvent(eventId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const exact_address = (formData.get("location") as string)?.trim() || null;
  const general_location = (formData.get("general_location") as string)?.trim() || null;
  // Hosts paste the share link the Maps app gives them; expand it now so the
  // stored URL is one an iPhone can actually open. See lib/maps-server.ts.
  const location_url = await resolveMapUrl(formData.get("location_url") as string);
  const virtual_url = (formData.get("virtual_url") as string)?.trim() || null;
  const image_url = (formData.get("image_url") as string)?.trim() || null;
  const dateStr = formData.get("starts_at") as string;
  const endsStr = formData.get("ends_at") as string;
  const starts_at = dateStr ? new Date(dateStr).toISOString() : null;
  const ends_at = endsStr ? new Date(endsStr).toISOString() : null;
  const timezone = (formData.get("timezone") as string)?.trim() || "America/Los_Angeles";
  const need_ids = (formData.getAll("need_ids") as string[]).filter(Boolean);

  const { data: event, error } = await supabase
    .from("events")
    .update({ title, description, location: general_location, general_location, exact_address, location_url, virtual_url, image_url, starts_at, ends_at, timezone, format: readFormat(formData) })
    .eq("id", eventId)
    .select("community_id")
    .single();

  if (error) throw new Error(error.message);

  // Re-sync doorway tags: the form always posts the full set, so replace rather
  // than merge — unchecking a doorway has to actually remove it.
  await supabase.from("event_needs").delete().eq("event_id", eventId);
  if (need_ids.length > 0) {
    await supabase
      .from("event_needs")
      .insert(need_ids.map((need_id) => ({ event_id: eventId, need_id })));
  }
  revalidatePath("/needs", "layout");

  const { data: community } = await supabase
    .from("communities").select("slug").eq("id", event.community_id).single();

  revalidatePath(`/community/${community?.slug}/events/${eventId}`);
}

export async function cancelEvent(eventId: string, communitySlug: string) {
  const supabase = await createClient();
  await supabase.from("events").update({ status: "cancelled" }).eq("id", eventId);
  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
  revalidatePath(`/community/${communitySlug}/events`);
}

// Host-initiated SMS to everyone who said yes — for day-of changes (venue
// moved, late start) where email and in-app notifications are too slow.
export async function smsEventAttendees(
  eventId: string,
  communitySlug: string,
  message: string
): Promise<{ sent: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { smsEnabled } = await import("@/lib/phone");
  if (!smsEnabled()) throw new Error("SMS is not configured");

  const trimmed = message.trim();
  if (!trimmed) throw new Error("Message is required");
  if (trimmed.length > 320) throw new Error("Message is too long (320 characters max)");

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("community_id, created_by, title")
    .eq("id", eventId)
    .single();
  if (!event) throw new Error("Event not found");

  if (event.created_by !== user.id) {
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
  }

  const [{ data: memberRsvps }, { data: guestRsvps }] = await Promise.all([
    admin
      .from("rsvps")
      .select("users!inner(phone, notify_sms)")
      .eq("event_id", eventId)
      .eq("status", "yes"),
    admin
      .from("guest_rsvps")
      .select("phone, notify_sms")
      .eq("event_id", eventId)
      .eq("status", "yes"),
  ]);

  const phones = new Set<string>();
  for (const r of memberRsvps ?? []) {
    const u = r.users as unknown as { phone: string | null; notify_sms: boolean };
    if (u.phone && u.notify_sms) phones.add(u.phone);
  }
  for (const g of guestRsvps ?? []) {
    if (g.phone && g.notify_sms) phones.add(g.phone);
  }

  if (phones.size === 0) return { sent: 0 };

  const { sendSms } = await import("@/lib/integrations/twilio");
  const body = `${event.title}: ${trimmed}`;
  const results = await Promise.allSettled(
    [...phones].map((phone) => sendSms(phone, body))
  );

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
  return { sent: results.filter((r) => r.status === "fulfilled").length };
}

export async function lockEventToDate(eventId: string, optionId: string, communitySlug: string) {
  const supabase = await createClient();

  const { data: option } = await supabase
    .from("event_date_options")
    .select("starts_at, ends_at")
    .eq("id", optionId)
    .single();

  if (!option) throw new Error("Option not found");

  await supabase.from("events").update({
    status: "confirmed",
    starts_at: option.starts_at,
    ends_at: option.ends_at,
  }).eq("id", eventId);

  revalidatePath(`/community/${communitySlug}/events/${eventId}`);
}
