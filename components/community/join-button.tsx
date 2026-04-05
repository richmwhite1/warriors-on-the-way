"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinCommunity, leaveCommunity } from "@/lib/actions/members";
import { toast } from "sonner";

type Props = {
  communityId: string;
  communitySlug: string;
  status: "none" | "active" | "waitlisted" | "pending_approval" | "banned";
  isFull: boolean;
};

export function JoinButton({ communityId, communitySlug, status, isFull }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleJoin() {
    startTransition(async () => {
      try {
        await joinCommunity(communityId, communitySlug);
        if (isFull) toast.info("You've been added to the waitlist.");
        else toast.success("You've joined the community!");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleLeave() {
    startTransition(async () => {
      try {
        await leaveCommunity(communityId, communitySlug);
        toast.success("You've left the community.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  if (status === "banned") return null;

  if (status === "active") {
    return (
      <Button variant="outline" size="sm" onClick={handleLeave} disabled={isPending}>
        {isPending ? "Leaving…" : "Leave community"}
      </Button>
    );
  }

  if (status === "waitlisted") {
    return (
      <Button variant="outline" size="sm" disabled>
        On waitlist
      </Button>
    );
  }

  if (status === "pending_approval") {
    return (
      <Button variant="outline" size="sm" disabled>
        Request pending
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={handleJoin} disabled={isPending}>
      {isPending ? "Joining…" : isFull ? "Join waitlist" : "Join community"}
    </Button>
  );
}
