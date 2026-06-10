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
