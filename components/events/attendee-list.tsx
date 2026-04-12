"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { setRsvpPaymentStatus, toggleCheckIn } from "@/lib/actions/rsvp";
import { toast } from "sonner";
import type { EventAttendee } from "@/lib/queries/events";

type Props = {
  attendees: EventAttendee[];
  isAdmin: boolean;
  registrationFee?: number | null;
  eventId: string;
  communitySlug: string;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const PAYMENT_NEXT: Record<"unpaid" | "paid" | "waived", "unpaid" | "paid" | "waived"> = {
  unpaid: "paid",
  paid: "waived",
  waived: "unpaid",
};

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

  function cyclePayment() {
    const next = PAYMENT_NEXT[attendee.payment_status];
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

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${isPending ? "opacity-60" : "hover:bg-muted/40"}`}>
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
        <Link
          href={`/profile/${attendee.user_id}`}
          className="text-sm font-medium hover:underline truncate block"
        >
          {attendee.user.display_name}
        </Link>
        {attendee.guests > 0 && (
          <span className="text-xs text-muted-foreground">+{attendee.guests} guest{attendee.guests !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Right-side badges and actions */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        {/* Payment status */}
        {hasFee && (
          isAdmin ? (
            <button
              onClick={cyclePayment}
              disabled={isPending}
              title="Click to cycle payment status"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            >
              <PaymentBadge status={attendee.payment_status} />
            </button>
          ) : (
            <PaymentBadge status={attendee.payment_status} />
          )
        )}

        {/* Check-in (admin only) */}
        {isAdmin && (
          <button
            onClick={handleCheckIn}
            disabled={isPending}
            title={isCheckedIn ? "Remove check-in" : "Check in"}
            className={`text-xs px-2 py-0.5 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isCheckedIn
                ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {isCheckedIn ? "✓ In" : "Check in"}
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentBadge({ status }: { status: "unpaid" | "paid" | "waived" }) {
  if (status === "paid") {
    return (
      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
        Paid
      </Badge>
    );
  }
  if (status === "waived") {
    return <Badge variant="secondary">Waived</Badge>;
  }
  return <Badge variant="destructive">Owes</Badge>;
}

function AttendeeSection({
  label,
  attendees,
  isAdmin,
  hasFee,
  eventId,
  communitySlug,
}: {
  label: string;
  attendees: EventAttendee[];
  isAdmin: boolean;
  hasFee: boolean;
  eventId: string;
  communitySlug: string;
}) {
  if (attendees.length === 0) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 pb-1">
        {label} · {attendees.length}
      </p>
      {attendees.map((a) => (
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
  );
}

export function AttendeeList({
  attendees,
  isAdmin,
  registrationFee,
  eventId,
  communitySlug,
}: Props) {
  const going = attendees.filter((a) => a.status === "yes");
  const maybe = attendees.filter((a) => a.status === "maybe");
  const hasFee = !!registrationFee && registrationFee > 0;

  return (
    <div className="rounded-2xl border bg-card divide-y divide-border/50">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <p className="text-sm font-medium">Attendees</p>
        {isAdmin && hasFee && (
          <p className="text-xs text-muted-foreground">
            {going.filter((a) => a.payment_status === "paid").length} of {going.length} paid
          </p>
        )}
      </div>

      {/* Going section */}
      <div className="p-1.5">
        <AttendeeSection
          label="Going"
          attendees={going}
          isAdmin={isAdmin}
          hasFee={hasFee}
          eventId={eventId}
          communitySlug={communitySlug}
        />
      </div>

      {/* Maybe section */}
      {maybe.length > 0 && (
        <div className="p-1.5">
          <AttendeeSection
            label="Maybe"
            attendees={maybe}
            isAdmin={isAdmin}
            hasFee={hasFee}
            eventId={eventId}
            communitySlug={communitySlug}
          />
        </div>
      )}

      {isAdmin && hasFee && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          Tap a payment badge to cycle: Owes → Paid → Waived
        </div>
      )}
    </div>
  );
}
