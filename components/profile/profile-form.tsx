"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/queries/users";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { getDefaultTimezone } from "@/lib/timezones";

export function ProfileForm({ user, redirectAfterSave, smsEnabled = false }: { user: UserProfile; redirectAfterSave?: string; smsEnabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [phoneValue, setPhoneValue] = useState(user.phone ?? "");
  const [deviceZone, setDeviceZone] = useState<string | undefined>(undefined);
  const [timezone, setTimezone] = useState(user.timezone || "UTC");
  const router = useRouter();

  // "UTC" is the column default, not a choice anyone made. The event form
  // already defaults to the device zone; the profile should agree.
  const [autoDetected, setAutoDetected] = useState(false);
  useEffect(() => {
    const zone = getDefaultTimezone();
    setDeviceZone(zone);
    if ((!user.timezone || user.timezone === "UTC") && zone !== "UTC") {
      setTimezone(zone);
      setAutoDetected(true);
    }
  }, [user.timezone]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateProfile(formData);
        toast.success("Profile updated");
        if (redirectAfterSave) {
          router.push(redirectAfterSave);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-3">
        <div className="space-y-1.5 flex-1">
          <Label htmlFor="first_name">First name</Label>
          <Input
            id="first_name"
            name="first_name"
            defaultValue={user.first_name ?? user.display_name.split(" ")[0] ?? ""}
            required
            maxLength={40}
            placeholder="Jane"
          />
        </div>
        <div className="space-y-1.5" style={{ width: 90 }}>
          <Label htmlFor="last_initial">Last initial</Label>
          <Input
            id="last_initial"
            name="last_initial"
            defaultValue={user.last_initial ?? ""}
            required
            maxLength={1}
            placeholder="e.g. D"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Real names only. You&apos;ll appear as &quot;First L.&quot; to others.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="birthdate">Date of birth</Label>
        <Input
          id="birthdate"
          name="birthdate"
          type="date"
          defaultValue={user.birthdate ?? ""}
          required
        />
        <p className="text-xs text-muted-foreground">
          You must be 18 or older to join.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={user.bio ?? ""}
          maxLength={280}
          rows={3}
          placeholder="A few words about yourself…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <TimezoneSelect
          id="timezone"
          name="timezone"
          value={timezone}
          onChange={setTimezone}
          deviceZone={deviceZone}
        />
        {autoDetected && (
          <p className="text-xs text-muted-foreground">
            Detected from your device. Change it if that&apos;s not where you are.
          </p>
        )}
      </div>

      {/* Phone/SMS — hidden when Twilio isn't configured: never promise
          texts that won't be sent. The server action also skips these fields
          so existing data is preserved. */}
      {smsEnabled && (
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          value={phoneValue}
          onChange={(e) => setPhoneValue(e.target.value)}
          maxLength={20}
          placeholder="(555) 123-4567"
        />
        <p className="text-xs text-muted-foreground">
          For SMS event reminders. US numbers only for now.
        </p>
      </div>
      )}

      {smsEnabled && phoneValue.trim() && (
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="notify_sms"
            name="notify_sms"
            defaultChecked={user.notify_sms}
            className="h-4 w-4 mt-0.5 rounded border-border"
          />
          <Label htmlFor="notify_sms" className="text-sm font-normal cursor-pointer leading-snug">
            Text me event reminders. Msg &amp; data rates may apply. Reply STOP
            anytime to opt out.
          </Label>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="venmo_handle">Venmo username</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
          <Input
            id="venmo_handle"
            name="venmo_handle"
            defaultValue={user.venmo_handle ?? ""}
            maxLength={40}
            placeholder="your-venmo"
            className="pl-7"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Shows next to your name on event expense splits so members can pay you.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Saving…" : redirectAfterSave ? "Save & continue" : "Save profile"}
      </Button>
    </form>
  );
}
