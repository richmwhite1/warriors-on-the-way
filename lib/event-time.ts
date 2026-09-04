/**
 * Event times, in the timezone the host chose.
 *
 * A `<input type="datetime-local">` posts a bare wall-clock string — "2026-09-05T12:00"
 * — with no offset in it. `new Date("2026-09-05T12:00")` therefore resolves it against
 * whatever timezone the *machine doing the parsing* is in. On Vercel that is UTC, so a
 * host in Denver who typed 12:00 PM had 12:00 UTC written to the database: 6:00 AM their
 * time. The `timezone` column was collected on the form and then never used to interpret
 * the input, so the stored instant was wrong by the host's UTC offset.
 *
 * The rest of the app then disagreed with itself about the mistake. Server components
 * formatted with no `timeZone` option (so: UTC, and the error cancelled out by accident);
 * client components formatted in the *viewer's* zone; only the email/SMS/Telegram paths
 * passed `event.timezone` — which is why a reminder said 6:00 AM for an event the page
 * said was at noon.
 *
 * Everything here works in the event's own timezone, on both sides of the wire:
 * `zonedInputToUtcIso` on write, `utcIsoToZonedInput` on prefill, and the `formatEvent*`
 * helpers on render. An event is an appointment at a place — the place's clock is the
 * one that counts, and it is the same clock for every viewer.
 */

// Anchored, and deliberately intolerant of a trailing "Z" or "+05:30": a string that
// names its own offset already names one instant, and must not be re-read as a wall
// clock. An unanchored prefix match would have swallowed "2026-09-05T12:00:00Z" and
// shifted it by the zone's offset.
const LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

export const FALLBACK_TIMEZONE = "UTC";

/** Guard against a bad/unknown IANA name taking a page down inside Intl. */
export function safeTimezone(timeZone: string | null | undefined): string {
  const tz = timeZone?.trim();
  if (!tz) return FALLBACK_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

type Wall = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** The wall-clock reading a given zone shows at a given instant. */
function wallClockIn(date: Date, timeZone: string): Wall {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    // Some engines render midnight as "24" under hour12:false.
    hour: get("hour") % 24,
    minute: get("minute"),
    second: get("second"),
  };
}

/** How far ahead of UTC the zone is at this instant, in milliseconds. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const w = wallClockIn(date, timeZone);
  const asIfUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asIfUtc - date.getTime();
}

/**
 * "2026-09-05T12:00" + "America/Denver" → the UTC instant that wall clock names.
 *
 * Two passes: the first uses the offset in force at the naive instant, the second
 * re-checks the offset at the answer, so a time on the far side of a DST boundary
 * still lands on the clock reading the host actually typed.
 */
export function zonedInputToUtcIso(
  input: string | null | undefined,
  timeZone: string | null | undefined
): string | null {
  const raw = input?.trim();
  if (!raw) return null;

  const m = LOCAL_INPUT_RE.exec(raw);
  if (!m) {
    // Not a datetime-local string — an ISO instant with an offset already means
    // exactly one moment, so leave it alone.
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const tz = safeTimezone(timeZone);
  const [, y, mo, d, h, mi] = m;
  const naive = Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));

  let ts = naive - zoneOffsetMs(new Date(naive), tz);
  ts = naive - zoneOffsetMs(new Date(ts), tz);

  const result = new Date(ts);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** Inverse of the above — what the edit form's datetime-local input should show. */
export function utcIsoToZonedInput(
  iso: string | null | undefined,
  timeZone: string | null | undefined
): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const w = wallClockIn(date, safeTimezone(timeZone));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.year}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`;
}

function toDate(iso: string | Date | null | undefined): Date | null {
  if (!iso) return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatEventDate(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" }
): string {
  const d = toDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { ...options, timeZone: safeTimezone(timeZone) });
}

export function formatEventTime(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" }
): string {
  const d = toDate(iso);
  if (!d) return "";
  return d.toLocaleTimeString("en-US", { ...options, timeZone: safeTimezone(timeZone) });
}

/** "MDT" — worth printing whenever a guest might be in a different zone. */
export function timezoneAbbreviation(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined
): string {
  const d = toDate(iso) ?? new Date();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: safeTimezone(timeZone),
      timeZoneName: "short",
    }).formatToParts(d);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** The day-of-month as the event's own zone numbers it — for date chips. */
export function eventDayOfMonth(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined
): string {
  const d = toDate(iso);
  if (!d) return "";
  return String(wallClockIn(d, safeTimezone(timeZone)).day);
}

/**
 * Calendar days between now and the event, counted on the event's calendar
 * rather than by dividing elapsed milliseconds — "tomorrow" is a date change,
 * not a 24-hour span.
 */
export function daysUntilEvent(
  iso: string | Date | null | undefined,
  timeZone: string | null | undefined,
  now: Date = new Date()
): number | null {
  const d = toDate(iso);
  if (!d) return null;

  const tz = safeTimezone(timeZone);
  const startOfDay = (x: Date) => {
    const w = wallClockIn(x, tz);
    return Date.UTC(w.year, w.month - 1, w.day);
  };

  return Math.round((startOfDay(d) - startOfDay(now)) / 86_400_000);
}
