import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { EventRow } from "@/lib/queries/events";

type Props = { event: EventRow; communitySlug: string };

const STATUS_COLORS = {
  confirmed: "default",
  voting: "secondary",
  draft: "outline",
  cancelled: "destructive",
} as const;

export function EventCard({ event, communitySlug }: Props) {
  const counts = event.rsvp_counts;
  const startsAt = event.starts_at ? new Date(event.starts_at) : null;
  const isPast = startsAt ? startsAt < new Date() : false;

  return (
    <Link href={`/community/${communitySlug}/events/${event.id}`} className="block group">
      <div className={`rounded-2xl border bg-card p-4 transition-all group-hover:shadow-md active:scale-[0.99] flex gap-3${isPast ? " opacity-75" : ""}`}>
        {/* Date chip */}
        {startsAt && (
          <div
            className="shrink-0 w-12 text-center rounded-xl py-2 px-1"
            style={{ background: "#fff5f0" }}
          >
            <p className="text-[11px] font-bold text-primary uppercase leading-none">
              {startsAt.toLocaleDateString("en-US", { month: "short" })}
            </p>
            <p className="text-xl font-extrabold text-foreground leading-tight">
              {startsAt.getDate()}
            </p>
          </div>
        )}

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-heading font-bold text-foreground truncate">{event.title}</p>
            <Badge variant={STATUS_COLORS[event.status]} className="shrink-0 capitalize">
              {event.status}
            </Badge>
          </div>

          {startsAt ? (
            <p className="text-sm text-muted-foreground">
              {startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Date TBD</p>
          )}

          {event.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>📍</span> {event.location}
            </p>
          )}

          {counts && (counts.yes > 0 || counts.maybe > 0) && (
            <div className="flex gap-3 text-xs pt-0.5">
              {counts.yes > 0 && (
                <span className="text-green-600 font-semibold">
                  {counts.yes} {isPast ? "went" : "going"}
                </span>
              )}
              {counts.maybe > 0 && (
                <span className="text-muted-foreground">
                  {counts.maybe} maybe
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
