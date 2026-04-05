import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("title, description, location, virtual_url, starts_at, ends_at, timezone")
    .eq("id", eventId)
    .single();

  if (!event || !event.starts_at) {
    return new Response("Event not found or date not set", { status: 404 });
  }

  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  function icsDate(d: Date) {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  const description = [event.description, event.virtual_url ? `Virtual link: ${event.virtual_url}` : ""]
    .filter(Boolean).join("\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Warriors on the Way//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${eventId}@warriorsontheway`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${event.title}`,
    event.description ? `DESCRIPTION:${description}` : "",
    event.location ? `LOCATION:${event.location}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.title.replace(/[^a-z0-9]/gi, "-")}.ics"`,
    },
  });
}
