"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { upsertRsvp } from "@/lib/actions/rsvp";
import { InviteModal } from "@/components/events/invite-modal";
import { toast } from "sonner";

type Props = {
  eventId: string;
  communitySlug: string;
  current: { status: string; guests: number } | null;
  mapsUrl?: string | null;
  hasDate?: boolean;
  // Powers the "bring a friend" nudge once someone is going.
  eventTitle?: string;
  shareUrl?: string;
  hostName?: string;
};

export function RsvpButtons({ eventId, communitySlug, current, mapsUrl, hasDate, eventTitle, shareUrl, hostName }: Props) {
  const [guests, setGuests] = useState(current?.guests ?? 0);
  const [isPending, startTransition] = useTransition();

  function handleRsvp(status: "yes" | "no" | "maybe") {
    submitRsvp(status);
  }

  function submitRsvp(status: "yes" | "no" | "maybe") {
    startTransition(async () => {
      try {
        await upsertRsvp(eventId, status, status === "yes" ? guests : 0, communitySlug, true);
        toast.success(
          status === "yes" ? "You're going!" :
          status === "maybe" ? "Marked as maybe" : "Marked as not going"
        );
      } catch { toast.error("Failed to update RSVP"); }
    });
  }

  const s = current?.status;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(["yes", "maybe", "no"] as const).map((status) => (
          <Button
            key={status}
            variant={s === status ? "default" : "outline"}
            disabled={isPending}
            onClick={() => handleRsvp(status)}
            className="capitalize flex-1 sm:flex-none min-h-11"
          >
            {status === "yes" ? "✓ Going" : status === "maybe" ? "? Maybe" : "✗ Can't go"}
          </Button>
        ))}
      </div>

      {s === "yes" && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="guests" className="text-muted-foreground">+ guests</label>
          <input
            id="guests"
            type="number"
            min={0}
            max={10}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            onFocus={(e) => e.target.select()}
            onBlur={() => handleRsvp("yes")}
            className="w-16 rounded-lg border bg-background px-2 py-1 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {/* The moment after "yes" — capture the calendar + directions while intent is hot */}
      {s === "yes" && (hasDate || mapsUrl || (eventTitle && shareUrl)) && (
        <div className="rounded-xl border bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/40 p-3 flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mr-auto">
            You&apos;re going!
          </p>
          {hasDate && (
            <a href={`/api/events/${eventId}/calendar`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Add to calendar
            </a>
          )}
          {mapsUrl && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Directions
            </a>
          )}
          {eventTitle && shareUrl && (
            <InviteModal
              eventTitle={eventTitle}
              eventUrl={shareUrl}
              hostName={hostName ?? ""}
              trigger={
                <span className={cn(buttonVariants({ size: "sm" }), "cursor-pointer")}>
                  Bring a friend
                </span>
              }
            />
          )}
        </div>
      )}

    </div>
  );
}
