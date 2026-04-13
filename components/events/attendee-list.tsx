"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { setRsvpPaymentStatus, toggleCheckIn } from "@/lib/actions/rsvp";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EventAttendee } from "@/lib/queries/events";

type PaymentStatus = "unpaid" | "sent" | "confirmed" | "waived";

type Props = {
  attendees: EventAttendee[];
  isAdmin: boolean;
  registrationFee?: number | null;
  eventId: string;
  communitySlug: string;
};

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// Visual chip for a payment status — no actions, just display
function StatusChip({ status }: { status: PaymentStatus }) {
  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/25">
        ✓ Confirmed
      </span>
    );
  }
  if (status === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/25">
        Sent
      </span>
    );
  }
  if (status === "waived") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
        Waived
      </span>
    );
  }
  // unpaid
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
      Pending
    </span>
  );
}

function AttendeeRow({
  attendee,
  isAdmin,
  hasFee,
  eventId,
  communitySlug,
}: {
  attendee: EventAttendee;
  isAdmin: boolean;
  hasFee: boolean;
  eventId: string;
  communitySlug: string;
}) {
  const [isPending, startTransition] = useTransition();

  function setStatus(next: PaymentStatus) {
    startTransition(async () => {
      try {
        await setRsvpPaymentStatus(eventId, attendee.user_id, next, communitySlug);
      } catch {
        toast.error("Failed to update payment status");
      }
    });
  }

  function handleCheckIn() {
    const checkedIn = !attendee.checked_in_at;
    startTransition(async () => {
      try {
        await toggleCheckIn(eventId, attendee.user_id, checkedIn, communitySlug);
        toast.success(checkedIn ? `${attendee.user.display_name} checked in` : "Check-in removed");
      } catch {
        toast.error("Failed to update check-in");
      }
    });
  }

  const isCheckedIn = !!attendee.checked_in_at;
  const ps = attendee.payment_status;

  return (
    <div className={cn(
      "flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors",
      isPending ? "opacity-60" : "hover:bg-muted/40"
    )}>
      {/* Avatar */}
      <Link href={`/profile/${attendee.user_id}`} className="shrink-0">
        <Avatar size="default">
          {attendee.user.avatar_url && (
            <AvatarImage src={attendee.user.avatar_url} alt={attendee.user.display_name} />
          )}
          <AvatarFallback>{getInitials(attendee.user.display_name)}</AvatarFallback>
        </Avatar>
      </Link>

      {/* Name + guests */}
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${attendee.user_id}`} className="text-sm font-medium hover:underline truncate block">
          {attendee.user.display_name}
        </Link>
        {attendee.guests > 0 && (
          <span className="text-xs text-muted-foreground">+{attendee.guests} guest{attendee.guests !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">

        {/* Registration fee status */}
        {hasFee && (
          <>
            <StatusChip status={ps} />
            {isAdmin && (
              <div className="flex items-center gap-1">
                {/* Show Confirm when sent but not yet confirmed */}
                {ps === "sent" && (
                  <button
                    onClick={() => setStatus("confirmed")}
                    disabled={isPending}
                    className="text-xs px-2 py-0.5 rounded-full border border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10 transition-colors font-medium"
                  >
                    Confirm
                  </button>
                )}
                {/* For unpaid, admin can confirm directly (e.g. cash) */}
                {ps === "unpaid" && (
                  <button
                    onClick={() => setStatus("confirmed")}
                    disabled={isPending}
                    className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    Mark paid
                  </button>
                )}
                {/* Waive option for sent/unpaid */}
                {(ps === "sent" || ps === "unpaid") && (
                  <button
                    onClick={() => setStatus("waived")}
                    disabled={isPending}
                    className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                  >
                    Waive
                  </button>
                )}
                {/* Allow resetting waived/confirmed back to unpaid */}
                {(ps === "waived" || ps === "confirmed") && (
                  <button
                    onClick={() => setStatus("unpaid")}
                    disabled={isPending}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Check-in (admin only, day-of) */}
        {isAdmin && (
          <button
            onClick={handleCheckIn}
            disabled={isPending}
            title={isCheckedIn ? "Remove check-in" : "Check in"}
            className={cn(
              "text-xs px-2 py-0.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isCheckedIn
                ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {isCheckedIn ? "✓ In" : "Check in"}
          </button>
        )}
      </div>
    </div>
  );
}

export function AttendeeList({ attendees, isAdmin, registrationFee, eventId, communitySlug }: Props) {
  const going = attendees.filter((a) => a.status === "yes");
  const maybe = attendees.filter((a) => a.status === "maybe");
  const hasFee = !!registrationFee && registrationFee > 0;

  const confirmed = going.filter((a) => a.payment_status === "confirmed").length;
  const sent = going.filter((a) => a.payment_status === "sent").length;
  const pending = going.filter((a) => a.payment_status === "unpaid").length;

  return (
    <div className="rounded-2xl border bg-card divide-y divide-border/50">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Attendees</p>
        {hasFee && going.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {confirmed > 0 && <span className="text-green-600 font-medium">{confirmed} confirmed</span>}
            {sent > 0 && <span className="text-blue-600 font-medium">{sent} sent</span>}
            {pending > 0 && <span className="text-amber-600">{pending} pending</span>}
          </div>
        )}
      </div>

      {/* Going */}
      {going.length > 0 && (
        <div className="p-1.5 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pb-1">
            Going · {going.length}
          </p>
          {going.map((a) => (
            <AttendeeRow
              key={a.user_id}
              attendee={a}
              isAdmin={isAdmin}
              hasFee={hasFee}
              eventId={eventId}
              communitySlug={communitySlug}
            />
          ))}
        </div>
      )}

      {/* Maybe */}
      {maybe.length > 0 && (
        <div className="p-1.5 space-y-0.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pb-1">
            Maybe · {maybe.length}
          </p>
          {maybe.map((a) => (
            <AttendeeRow
              key={a.user_id}
              attendee={a}
              isAdmin={isAdmin}
              hasFee={false}
              eventId={eventId}
              communitySlug={communitySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
