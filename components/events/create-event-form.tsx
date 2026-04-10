"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { createEvent } from "@/lib/actions/events";
import { toast } from "sonner";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Anchorage", "Pacific/Honolulu",
  "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
];

type Props = { communityId: string; communitySlug: string };

export function CreateEventForm({ communityId }: Props) {
  const [mode, setMode] = useState<"confirmed" | "voting">("confirmed");
  const [dateOptions, setDateOptions] = useState([{ starts_at: "", ends_at: "" }]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("community_id", communityId);
    fd.set("mode", mode);
    if (imageUrl) fd.set("image_url", imageUrl);
    startTransition(async () => {
      try {
        await createEvent(fd);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Event title</Label>
        <Input id="title" name="title" required maxLength={120} placeholder="Morning hike at Muir Woods" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description" name="description" rows={3} maxLength={1000}
          placeholder="What to expect, what to bring…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Event image</Label>
        <ImageUpload
          value={imageUrl}
          onChange={(url) => setImageUrl(url || null)}
          label="Upload event photo"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Muir Woods Visitor Center" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="virtual_url">Virtual link</Label>
          <Input id="virtual_url" name="virtual_url" type="url" placeholder="https://meet.google.com/..." />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <select id="timezone" name="timezone" defaultValue="America/Los_Angeles"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Date mode toggle */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Date</legend>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={mode === "confirmed"} onChange={() => setMode("confirmed")} />
            Set a date
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="radio" checked={mode === "voting"} onChange={() => setMode("voting")} />
            Let members vote on date
          </label>
        </div>
      </fieldset>

      {mode === "confirmed" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="starts_at">Start</Label>
            <Input id="starts_at" name="starts_at" type="datetime-local" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ends_at">End</Label>
            <Input id="ends_at" name="ends_at" type="datetime-local" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Date options</Label>
            <button type="button" onClick={() => setDateOptions([...dateOptions, { starts_at: "", ends_at: "" }])}
              className="text-xs text-primary hover:underline">+ Add option</button>
          </div>
          {dateOptions.map((opt, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Option {i + 1} start</Label>
                <Input type="datetime-local" name="option_starts_at"
                  value={opt.starts_at} onChange={(e) => {
                    const next = [...dateOptions]; next[i].starts_at = e.target.value; setDateOptions(next);
                  }} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">End (optional)</Label>
                <Input type="datetime-local" name="option_ends_at"
                  value={opt.ends_at} onChange={(e) => {
                    const next = [...dateOptions]; next[i].ends_at = e.target.value; setDateOptions(next);
                  }} />
              </div>
            </div>
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="vote_threshold">Auto-lock threshold (%)</Label>
            <Input id="vote_threshold" name="vote_threshold" type="number" min={1} max={100} defaultValue={75} className="w-24" />
            <p className="text-xs text-muted-foreground">Event locks automatically when a date option reaches this % of members</p>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Creating…" : "Create event"}
      </Button>
    </form>
  );
}
