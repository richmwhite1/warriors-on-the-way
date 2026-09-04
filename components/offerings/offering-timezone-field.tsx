"use client";

import { useEffect, useState } from "react";

import { TimezoneSelect } from "@/components/ui/timezone-select";
import { getDefaultTimezone } from "@/lib/timezones";

/**
 * The zone a standing session is read on.
 *
 * This has to be a client component. `getDefaultTimezone()` asks
 * `Intl.DateTimeFormat().resolvedOptions()` where it is running — on the server that
 * is the server, which on Vercel is UTC. The offering form is a server component, so
 * resolving the default there handed every new offering "UTC" no matter where the
 * steward actually was, which is the same off-by-an-offset bug the timezone column
 * was added to fix.
 *
 * An existing offering keeps the zone it was saved in. A new one picks up the
 * steward's device zone after mount — the same shape profile-form.tsx uses, so the
 * server and client agree on the first render and nothing hydrates mismatched.
 */
export function OfferingTimezoneField({ initial }: { initial?: string | null }) {
  const [deviceZone, setDeviceZone] = useState<string | undefined>(undefined);
  const [timezone, setTimezone] = useState(initial ?? "");

  useEffect(() => {
    const zone = getDefaultTimezone();
    setDeviceZone(zone);
    if (!initial) setTimezone(zone);
  }, [initial]);

  return (
    <TimezoneSelect
      id="timezone"
      name="timezone"
      value={timezone}
      onChange={setTimezone}
      deviceZone={deviceZone}
    />
  );
}
