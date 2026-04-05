"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { castDateVote, removeDateVote } from "@/lib/actions/rsvp";
import { lockEventToDate } from "@/lib/actions/events";
import { toast } from "sonner";
import type { EventDateOption } from "@/lib/queries/events";

type Props = {
  eventId: string;
  communitySlug: string;
  options: EventDateOption[];
  threshold: number;
  totalMembers: number;
  isAdmin: boolean;
};

export function VotingPanel({ eventId, communitySlug, options, threshold, totalMembers, isAdmin }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleVote(option: EventDateOption) {
    startTransition(async () => {
      try {
        if (option.user_voted) {
          await removeDateVote(option.id, communitySlug, eventId);
        } else {
          await castDateVote(option.id, eventId, communitySlug);
          toast.success("Vote cast");
        }
      } catch { toast.error("Failed to vote"); }
    });
  }

  function handleLock(optionId: string) {
    startTransition(async () => {
      try {
        await lockEventToDate(eventId, optionId, communitySlug);
        toast.success("Date locked — event confirmed!");
      } catch { toast.error("Failed to lock date"); }
    });
  }

  const sorted = [...options].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Vote for a date</p>
        <span className="text-xs text-muted-foreground">
          Auto-locks at {threshold}% of members
        </span>
      </div>

      {sorted.map((opt) => {
        const pct = totalMembers > 0 ? Math.round(((opt.vote_count ?? 0) / totalMembers) * 100) : 0;
        const willAutoLock = pct >= threshold;

        return (
          <div
            key={opt.id}
            className={`rounded-xl border p-3 space-y-2 ${opt.user_voted ? "border-primary/50 bg-primary/5" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {new Date(opt.starts_at).toLocaleDateString("en-US", {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </p>
                {opt.ends_at && (
                  <p className="text-xs text-muted-foreground">
                    until {new Date(opt.ends_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{opt.vote_count ?? 0} votes · {pct}%</span>
                <Button
                  size="sm"
                  variant={opt.user_voted ? "default" : "outline"}
                  disabled={isPending}
                  onClick={() => handleVote(opt)}
                  className="h-7"
                >
                  {opt.user_voted ? "✓ Voted" : "Vote"}
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleLock(opt.id)}
                    className="h-7 text-xs"
                  >
                    Lock
                  </Button>
                )}
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${willAutoLock ? "bg-primary" : "bg-primary/40"}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>

            {willAutoLock && (
              <p className="text-xs text-primary font-medium">Threshold reached — locking…</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
