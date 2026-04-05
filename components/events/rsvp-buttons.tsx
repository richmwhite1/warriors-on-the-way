"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { upsertRsvp } from "@/lib/actions/rsvp";
import { toast } from "sonner";

type Props = {
  eventId: string;
  communitySlug: string;
  current: { status: string; guests: number } | null;
};

export function RsvpButtons({ eventId, communitySlug, current }: Props) {
  const [guests, setGuests] = useState(current?.guests ?? 0);
  const [isPending, startTransition] = useTransition();

  function handleRsvp(status: "yes" | "no" | "maybe") {
    startTransition(async () => {
      try {
        await upsertRsvp(eventId, status, status === "yes" ? guests : 0, communitySlug);
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
            size="sm"
            variant={s === status ? "default" : "outline"}
            disabled={isPending}
            onClick={() => handleRsvp(status)}
            className="capitalize"
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
            onBlur={() => handleRsvp("yes")}
            className="w-16 rounded-lg border bg-background px-2 py-1 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
