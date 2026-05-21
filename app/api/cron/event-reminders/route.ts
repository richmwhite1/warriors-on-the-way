import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEventReminder } from "@/lib/integrations/email";

// Protect the cron endpoint with a secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify request is from Vercel Cron or has the correct secret
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find events starting tomorrow (between 24h and 48h from now)
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: events } = await admin
    .from("events")
    .select(`
      id, title, starts_at, ends_at, timezone, location,
      community:communities!community_id(slug)
    `)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .gte("starts_at", tomorrow.toISOString())
    .lt("starts_at", dayAfter.toISOString());

  if (!events?.length) {
    return NextResponse.json({ sent: 0, events: 0 });
  }

  let totalSent = 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  for (const event of events) {
    // Get guest RSVPs with email who said yes or maybe
    const { data: guests } = await admin
      .from("guest_rsvps")
      .select("name, email, status")
      .eq("event_id", event.id)
      .in("status", ["yes", "maybe"])
      .not("email", "is", null);

    if (!guests?.length) continue;

    const communitySlug = (event.community as unknown as { slug: string })?.slug ?? "";
    const eventUrl = `${siteUrl}/community/${communitySlug}/events/${event.id}`;

    const eventDate = new Date(event.starts_at!).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const eventTime = new Date(event.starts_at!).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    for (const guest of guests) {
      if (!guest.email) continue;
      try {
        await sendEventReminder({
          to: guest.email,
          guestName: guest.name,
          eventTitle: event.title,
          eventDate,
          eventTime,
          location: event.location,
          eventUrl,
        });
        totalSent++;
      } catch {
        // best-effort — don't fail the whole cron
      }
    }
  }

  return NextResponse.json({ sent: totalSent, events: events.length });
}
