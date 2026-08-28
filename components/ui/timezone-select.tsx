"use client";

import { groupedTimezones, timezoneLabel, timezoneOffset } from "@/lib/timezones";

/**
 * Shared timezone picker. Both the profile and the event form used to render a
 * bare <select> over the full IANA list; this keeps the native control (which
 * behaves well on mobile) but leads with the device zone and groups the rest.
 */
export function TimezoneSelect({
  id,
  name,
  value,
  defaultValue,
  onChange,
  deviceZone,
  className,
}: {
  id?: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  deviceZone?: string;
  className?: string;
}) {
  const groups = groupedTimezones(deviceZone);

  return (
    <select
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={
        className ??
        "w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      }
    >
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.zones.map((tz) => {
            const offset = timezoneOffset(tz);
            return (
              <option key={tz} value={tz}>
                {timezoneLabel(tz)}
                {offset ? ` (${offset})` : ""}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}
