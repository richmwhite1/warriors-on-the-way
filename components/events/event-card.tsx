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

  return (
    <Link href={`/community/${communitySlug}/events/${event.id}`} className="block group">
      <div className="rounded-2xl border bg-card p-4 space-y-3 transition-shadow group-hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <p className="font-heading font-semibold text-foreground truncate">{event.title}</p>
            {event.starts_at ? (
              <p className="text-sm text-muted-foreground">
                {new Date(event.starts_at).toLocaleDateString("en-US", {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Date TBD — voting open</p>
            )}
          </div>
          <Badge variant={STATUS_COLORS[event.status]} className="shrink-0 capitalize">
            {event.status}
          </Badge>
        </div>

        {event.location && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span>📍</span> {event.location}
          </p>
        )}

        {counts && (counts.yes > 0 || counts.maybe > 0) && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {counts.yes > 0 && (
              <span className="text-green-600 font-medium">
                ✓ {counts.yes} going
              </span>
            )}
            {counts.maybe > 0 && (
              <span>? {counts.maybe} maybe</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
