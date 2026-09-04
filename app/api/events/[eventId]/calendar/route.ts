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

  // RFC 5545 §3.3.11: backslash, semicolon and comma are delimiters inside a TEXT
  // value, and a literal newline ends the property. A title or description carrying
  // any of them — "Potluck, 6pm; bring a dish" is enough — produced a file the
  // calendar app either mangled or rejected outright.
  function icsText(value: string) {
    return value
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  const description = [event.description, event.virtual_url ? `Virtual link: ${event.virtual_url}` : ""]
    .filter(Boolean).map(String).map(icsText).join("\\n");

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
    `SUMMARY:${icsText(event.title)}`,
    event.description ? `DESCRIPTION:${description}` : "",
    event.location ? `LOCATION:${icsText(event.location)}` : "",
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
