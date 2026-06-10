import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventReminder } from "@/lib/integrations/email";
import { sendEventReminderSms } from "@/lib/integrations/twilio";
import { smsEnabled } from "@/lib/phone";

const CRON_SECRET = process.env.CRON_SECRET;

type Recipient = {
  name: string;
  email: string | null;
  phone: string | null;
  notify_email: boolean;
  notify_sms: boolean;
  user_id: string | null;
  guest_rsvp_id: string | null;
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  // Look at events in the next 48 hours
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: events } = await admin
    .from("events")
    .select(`
      id, title, starts_at, ends_at, timezone, location,
      community:communities!community_id(slug)
    `)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .gte("starts_at", now.toISOString())
    .lt("starts_at", horizon.toISOString());

  if (!events?.length) {
    return NextResponse.json({ sent: 0, events: 0 });
  }

  let smsSent = 0;
  let emailSent = 0;

  for (const event of events) {
    const startsAt = new Date(event.starts_at!);
    const hoursUntil = (startsAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Daily-bucket windows: the cron runs once a day (Hobby plan), so each
    // window must span a full day or events fall through the cracks.
    // The event_reminders_sent table dedupes if a run ever overlaps.
    let reminderType: "day_before" | "day_of" | null = null;
    if (hoursUntil >= 24 && hoursUntil < 48) {
      reminderType = "day_before";
    } else if (hoursUntil >= 0 && hoursUntil < 24) {
      reminderType = "day_of";
    }

    if (!reminderType) continue;

    const communitySlug =
      (event.community as unknown as { slug: string })?.slug ?? "";
    const eventUrl = `${siteUrl}/community/${communitySlug}/events/${event.id}`;

    const tz = event.timezone || "UTC";
    const eventDate = startsAt.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: tz,
    });
    const eventTime = startsAt.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
    });

    const dateLabel = reminderType === "day_before" ? "tomorrow" : "today";

    // ── Gather recipients ────────────────────────────────────────────────
    const recipients: Recipient[] = [];

    // 1. Authenticated RSVPs
    const { data: rsvps } = await admin
      .from("rsvps")
      .select("user_id, users!inner(display_name, phone, notify_email, notify_sms)")
      .eq("event_id", event.id)
      .in("status", ["yes", "maybe"]);

    if (rsvps) {
      const authUsers = await Promise.all(
        rsvps.map((r) => admin.auth.admin.getUserById(r.user_id).catch(() => null))
      );
      rsvps.forEach((r, i) => {
        const u = r.users as unknown as {
          display_name: string;
          phone: string | null;
          notify_email: boolean;
          notify_sms: boolean;
        };
        recipients.push({
          name: u.display_name,
          email: authUsers[i]?.data?.user?.email ?? null,
          phone: u.phone,
          notify_email: u.notify_email,
          notify_sms: u.notify_sms,
          user_id: r.user_id,
          guest_rsvp_id: null,
        });
      });
    }

    // 2. Guest RSVPs
    const { data: guests } = await admin
      .from("guest_rsvps")
      .select("id, name, email, phone, notify_sms, status")
      .eq("event_id", event.id)
      .in("status", ["yes", "maybe"]);

    if (guests) {
      for (const g of guests) {
        recipients.push({
          name: g.name,
          email: g.email,
          phone: g.phone,
          notify_email: !!g.email,
          notify_sms: g.notify_sms ?? true,
          user_id: null,
          guest_rsvp_id: g.id,
        });
      }
    }

    // ── Send reminders with idempotency ──────────────────────────────────
    // One SMS per phone number per event: the same person can appear as both
    // a member RSVP and a guest RSVP (or as multiple guest rows). Idempotency
    // rows are still written per recipient so dedupe is stable across runs.
    const seenPhones = new Set<string>();

    for (const r of recipients) {
      // SMS — skipped entirely (no idempotency rows) when Twilio isn't
      // configured, so enabling it later doesn't see reminders as already sent
      if (smsEnabled() && r.phone && r.notify_sms) {
        const phoneAlreadyHandled = seenPhones.has(r.phone);
        seenPhones.add(r.phone);

        const { data: inserted } = await admin
          .from("event_reminders_sent")
          .insert({
            event_id: event.id,
            channel: "sms",
            reminder_type: reminderType,
            user_id: r.user_id,
            guest_rsvp_id: r.guest_rsvp_id,
          })
          .select("id")
          .single();

        if (inserted && !phoneAlreadyHandled) {
          try {
            await sendEventReminderSms({
              to: r.phone,
              name: r.name,
              eventTitle: event.title,
              eventDate: dateLabel,
              eventTime,
              location: event.location,
              eventUrl,
            });
            smsSent++;
          } catch {
            // best-effort
          }
        }
      }

      // Email
      if (r.email && r.notify_email) {
        const { data: inserted } = await admin
          .from("event_reminders_sent")
          .insert({
            event_id: event.id,
            channel: "email",
            reminder_type: reminderType,
            user_id: r.user_id,
            guest_rsvp_id: r.guest_rsvp_id,
          })
          .select("id")
          .single();

        if (inserted) {
          try {
            await sendEventReminder({
              to: r.email,
              guestName: r.name,
              eventTitle: event.title,
              eventDate,
              eventTime,
              location: event.location,
              eventUrl,
              whenLabel: dateLabel,
            });
            emailSent++;
          } catch {
            // best-effort
          }
        }
      }
    }
  }

  return NextResponse.json({
    smsSent,
    emailSent,
    events: events.length,
  });
}
