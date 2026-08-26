"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { deleteOffering, setOfferingStatus } from "@/lib/actions/offerings";

// Steward controls for a standing offering.
//
// Pause, end and remove are three different things and collapsing them loses real
// information: a yoga class that stops for the winter comes back, a 6-week grief series
// that finished does not, and an offering created on the wrong community should never
// have existed. All three drop off the menu — only `active` is listed — but only the
// first has a resume path and only the last erases the history.
export function OfferingAdmin({
  offeringId,
  status,
}: {
  offeringId: string;
  status: "active" | "paused" | "ended";
}) {
  const [pending, startTransition] = useTransition();

  function change(next: "active" | "paused" | "ended", done: string) {
    startTransition(async () => {
      try {
        await setOfferingStatus(offeringId, next);
        toast.success(done);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't update this offering");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteOffering(offeringId);
      } catch (e) {
        // A successful delete redirects, which surfaces here as a thrown redirect —
        // rethrow anything Next needs to handle rather than swallowing it as an error.
        if (e && typeof e === "object" && "digest" in e) throw e;
        toast.error(e instanceof Error ? e.message : "Couldn't remove this offering");
      }
    });
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {status === "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("paused", "Paused — it won't show on the menu until you resume it.")}
          className="font-sans text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          Pause
        </button>
      )}

      {status !== "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => change("active", "Back on the menu.")}
          className="font-sans text-[13px] font-medium text-primary transition-colors hover:opacity-80 disabled:opacity-60"
        >
          Resume
        </button>
      )}

      {status !== "ended" && (
        <ConfirmButton
          disabled={pending}
          onConfirm={() => change("ended", "Marked as ended.")}
          confirmLabel="Yes, it's finished"
          className="font-sans text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
        >
          Mark as ended
        </ConfirmButton>
      )}

      <ConfirmButton
        disabled={pending}
        onConfirm={remove}
        confirmLabel="Remove permanently"
        className="font-sans text-[13px] font-medium text-destructive transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        Remove
      </ConfirmButton>
    </div>
  );
}
