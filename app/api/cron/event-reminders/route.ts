import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventReminder } from "@/lib/integrations/email";
import { sendEventReminderSms } from "@/lib/integrations/twilio";

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

    // Determine which reminder type applies for this hourly window
    let reminderType: "day_before" | "day_of" | null = null;
    if (hoursUntil >= 24 && hoursUntil < 25) {
      reminderType = "day_before";
    } else if (hoursUntil >= 2 && hoursUntil < 3) {
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
      for (const r of rsvps) {
        const u = r.users as unknown as {
          display_name: string;
          phone: string | null;
          notify_email: boolean;
          notify_sms: boolean;
        };
        // Get email from auth.users via admin
        const { data: authUser } = await admin.auth.admin.getUserById(r.user_id);
        recipients.push({
          name: u.display_name,
          email: authUser?.user?.email ?? null,
          phone: u.phone,
          notify_email: u.notify_email,
          notify_sms: u.notify_sms,
          user_id: r.user_id,
          guest_rsvp_id: null,
        });
      }
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
    for (const r of recipients) {
      // SMS
      if (r.phone && r.notify_sms) {
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

        if (inserted) {
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
