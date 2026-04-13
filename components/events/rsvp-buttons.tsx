"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { upsertRsvp } from "@/lib/actions/rsvp";
import { toast } from "sonner";

type Props = {
  eventId: string;
  communitySlug: string;
  current: { status: string; guests: number } | null;
  registrationFee?: number | null;
  creatorVenmo?: string | null;
};

export function RsvpButtons({ eventId, communitySlug, current, registrationFee, creatorVenmo }: Props) {
  const [guests, setGuests] = useState(current?.guests ?? 0);
  const [showFeeGate, setShowFeeGate] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasFee = !!registrationFee && registrationFee > 0;
  // Only gate if they haven't already RSVPed yes
  const needsFeeGate = hasFee && current?.status !== "yes";

  function handleRsvp(status: "yes" | "no" | "maybe") {
    if (status === "yes" && needsFeeGate) {
      setShowFeeGate(true);
      return;
    }
    submitRsvp(status);
  }

  function submitRsvp(status: "yes" | "no" | "maybe", throughFeeGate = false) {
    startTransition(async () => {
      try {
        await upsertRsvp(eventId, status, status === "yes" ? guests : 0, communitySlug, throughFeeGate);
        toast.success(
          status === "yes" ? "You're going!" :
          status === "maybe" ? "Marked as maybe" : "Marked as not going"
        );
        if (status === "yes") setShowFeeGate(false);
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
            onFocus={(e) => e.target.select()}
            onBlur={() => handleRsvp("yes")}
            className="w-16 rounded-lg border bg-background px-2 py-1 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}

      {/* Registration fee gate */}
      {showFeeGate && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Registration fee required</p>
          <p className="text-sm text-muted-foreground">
            This event has a <span className="font-medium text-foreground">${registrationFee!.toFixed(2)}</span> registration fee.
          </p>
          {creatorVenmo ? (
            <p className="text-sm">
              Please pay via Venmo:{" "}
              <a
                href={`https://venmo.com/${creatorVenmo}?txn=pay&amount=${registrationFee}&note=${encodeURIComponent("Event registration fee")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                @{creatorVenmo}
              </a>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Contact the event organizer for payment details.</p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => submitRsvp("yes", true)}
            >
              {isPending ? "Saving…" : "I've paid — confirm RSVP"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowFeeGate(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
