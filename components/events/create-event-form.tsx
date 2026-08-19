"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";
import { PlacesAutocomplete } from "@/components/ui/places-autocomplete";
import { createEvent } from "@/lib/actions/events";
import { TIMEZONES, getDefaultTimezone } from "@/lib/timezones";
import { toast } from "sonner";

type Props = { communityId: string; communitySlug: string };

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 pt-1">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {step}
      </span>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

export function CreateEventForm({ communityId, communitySlug }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"confirmed" | "voting">("confirmed");
  const [dateOptions, setDateOptions] = useState([{ starts_at: "", ends_at: "" }]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [tasksEnabled, setTasksEnabled] = useState(false);
  const [expensesEnabled, setExpensesEnabled] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("community_id", communityId);
    fd.set("community_slug", communitySlug);
    fd.set("mode", mode);
    fd.set("tasks_enabled", String(tasksEnabled));
    fd.set("expenses_enabled", String(expensesEnabled));
    if (imageUrl) fd.set("image_url", imageUrl);
    startTransition(async () => {
      try {
        const { eventId, communitySlug: slug } = await createEvent(fd);
        router.push(`/community/${slug}/events/${eventId}/invite`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create event");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Basics ─────────────────────────────────────────────── */}
      <SectionHeading step={1} title="Basics" />
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
          onChange={(url: string) => setImageUrl(url || null)}
          label="Upload event photo"
        />
      </div>

      {/* ── Location ───────────────────────────────────────────── */}
      <SectionHeading step={2} title="Location" />
      <div className="space-y-1.5">
        <Label htmlFor="general_location">General location</Label>
        <Input id="general_location" name="general_location" maxLength={120} placeholder="e.g. Sugar House, Salt Lake City" />
        <p className="text-xs text-muted-foreground">Visible to everyone — a neighborhood or area, not the address.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="location">Exact address</Label>
          <PlacesAutocomplete id="location" name="location" placeholder="Search for the exact place…" />
          <p className="text-xs text-muted-foreground">Only revealed to people once they RSVP.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="virtual_url">Virtual link</Label>
          <Input id="virtual_url" name="virtual_url" type="url" placeholder="https://meet.google.com/..." />
        </div>
      </div>

      {/* ── When ───────────────────────────────────────────────── */}
      <SectionHeading step={3} title="When" />
      {/* Date mode toggle — surfaced as two selectable cards so date-voting
          (a strong, easy-to-miss feature) reads as a first-class choice. */}
      <fieldset className="space-y-2">
        <legend className="sr-only">How the date is decided</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className={`flex items-start gap-2 cursor-pointer rounded-xl border p-3 transition-colors ${mode === "confirmed" ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
            <input type="radio" className="mt-0.5" checked={mode === "confirmed"} onChange={() => setMode("confirmed")} />
            <span>
              <span className="block text-sm font-medium">Set a date</span>
              <span className="block text-xs text-muted-foreground">You already know when.</span>
            </span>
          </label>
          <label className={`flex items-start gap-2 cursor-pointer rounded-xl border p-3 transition-colors ${mode === "voting" ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
            <input type="radio" className="mt-0.5" checked={mode === "voting"} onChange={() => setMode("voting")} />
            <span>
              <span className="block text-sm font-medium">Let members vote</span>
              <span className="block text-xs text-muted-foreground">Offer options; the group picks.</span>
            </span>
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

      <div className="space-y-1.5">
        <Label htmlFor="timezone">Timezone</Label>
        <select id="timezone" name="timezone" defaultValue={getDefaultTimezone()}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
        </select>
        <p className="text-xs text-muted-foreground">Defaulted to your device&apos;s timezone.</p>
      </div>

      {/* ── Options ────────────────────────────────────────────── */}
      <SectionHeading step={4} title="Options" />
      <div className="space-y-1.5">
        <Label htmlFor="registration_fee">Registration fee ($)</Label>
        <Input
          id="registration_fee"
          name="registration_fee"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00 (free)"
        />
        <p className="text-xs text-muted-foreground">Leave blank for free events</p>
      </div>

      {/* Optional modules */}
      <fieldset className="space-y-3 rounded-xl border p-4">
        <legend className="text-sm font-medium px-1">Add-ons</legend>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={tasksEnabled}
            onChange={(e) => setTasksEnabled(e.target.checked)}
          />
          <div>
            <p className="text-sm font-medium">Tasks</p>
            <p className="text-xs text-muted-foreground">Assign volunteer tasks to attendees</p>
          </div>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={expensesEnabled}
            onChange={(e) => setExpensesEnabled(e.target.checked)}
          />
          <div>
            <p className="text-sm font-medium">Shared expenses</p>
            <p className="text-xs text-muted-foreground">Track and split costs with Venmo links</p>
          </div>
        </label>
      </fieldset>

      {/* Sticky primary action so it's always in thumb reach on a long mobile form */}
      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-background/90 backdrop-blur border-t sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:border-0 sm:backdrop-blur-none">
        <Button type="submit" disabled={isPending} className="w-full min-h-11">
          {isPending ? "Creating…" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
