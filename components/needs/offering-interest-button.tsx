"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { toggleOfferingInterest } from "@/lib/actions/offerings";

// "I'm coming" for a standing offering.
//
// Events had RSVP; offerings — the recurring majority of the menu — had nothing but
// "Go to the community", which asks someone to join a group before they've decided to
// attend anything. This is the smaller, earlier yes.
//
// The count is the point. The hard part of a grief group or a yoga class is walking in
// alone, and "9 coming" is the answer to that; who those nine are stays private to the
// community (enforced by RLS, not by this button).
export function OfferingInterestButton({
  offeringId,
  initialInterested,
  initialCount,
  signedIn,
}: {
  offeringId: string;
  initialInterested: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [interested, setInterested] = useState(initialInterested);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <div className="space-y-2">
        <Link
          href={`/sign-in?next=/offerings/${offeringId}`}
          className="press-scale block min-h-11 rounded-full bg-primary px-6 py-3 text-center font-heading text-[15px] font-bold text-primary-foreground no-underline"
        >
          I&rsquo;m coming
        </Link>
        {count > 0 && (
          <p className="text-center font-sans text-[13px] text-muted-foreground">
            {count} {count === 1 ? "person is" : "people are"} coming
          </p>
        )}
      </div>
    );
  }

  function toggle() {
    const next = !interested;
    // Optimistic: the number is the reassurance people are here for, so it should move
    // the instant they commit, not after a round trip.
    setInterested(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    startTransition(async () => {
      try {
        await toggleOfferingInterest(offeringId, next);
      } catch {
        setInterested(!next);
        setCount((c) => Math.max(0, c + (next ? -1 : 1)));
        toast.error("Couldn't save that. Try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={interested}
        className={`press-scale block w-full min-h-11 rounded-full px-6 py-3 text-center font-heading text-[15px] font-bold transition-colors disabled:opacity-60 ${
          interested
            ? "border border-primary/40 bg-primary/10 text-primary"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {interested ? "You're coming ✓" : "I'm coming"}
      </button>
      <p className="text-center font-sans text-[13px] text-muted-foreground">
        {count === 0
          ? "Be the first to say you're coming."
          : `${count} ${count === 1 ? "person is" : "people are"} coming`}
      </p>
    </div>
  );
}
