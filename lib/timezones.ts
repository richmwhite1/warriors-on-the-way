const COMMON_TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney", "UTC",
];

// Common zones first, then the full IANA list so no one's home is missing.
export const TIMEZONES: string[] = (() => {
  try {
    const all = Intl.supportedValuesOf("timeZone");
    const common = new Set(COMMON_TIMEZONES);
    return [...COMMON_TIMEZONES, ...all.filter((tz) => !common.has(tz))];
  } catch {
    return COMMON_TIMEZONES;
  }
})();

export function getDefaultTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONES.includes(tz) ? tz : "America/Los_Angeles";
  } catch {
    return "America/Los_Angeles";
  }
}

/** "America/Los_Angeles" → "Los Angeles" (region shown by the optgroup). */
export function timezoneLabel(tz: string): string {
  const leaf = tz.includes("/") ? tz.slice(tz.indexOf("/") + 1) : tz;
  return leaf.replace(/_/g, " ").replace(/\//g, " — ");
}

/** Current UTC offset as "+05:30", for disambiguating similar city names. */
export function timezoneOffset(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

export type TimezoneGroup = { label: string; zones: string[] };

/**
 * A flat 400-entry <select> is unusable. Lead with the zones most people need,
 * then group the rest by region so scanning is possible.
 */
export function groupedTimezones(deviceZone?: string): TimezoneGroup[] {
  const groups: TimezoneGroup[] = [];
  const common = COMMON_TIMEZONES.filter((tz) => tz !== deviceZone);

  if (deviceZone && TIMEZONES.includes(deviceZone)) {
    groups.push({ label: "Your device", zones: [deviceZone] });
  }
  groups.push({ label: "Common", zones: common });

  const seen = new Set([...(deviceZone ? [deviceZone] : []), ...common]);
  const byRegion = new Map<string, string[]>();
  for (const tz of TIMEZONES) {
    if (seen.has(tz)) continue;
    const region = tz.includes("/") ? tz.slice(0, tz.indexOf("/")) : "Other";
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push(tz);
  }
  for (const [region, zones] of [...byRegion.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    groups.push({ label: region.replace(/_/g, " "), zones });
  }
  return groups;
}
